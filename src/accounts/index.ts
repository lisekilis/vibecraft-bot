import { patchUser } from '../helpers/user';
import {
	MicrosoftErrorResponse,
	MinecraftTokenResponse,
	XboxLiveErrorCodes,
	XboxLiveTokenResponse,
	XSTSTokenResponse,
} from '../types/microsoft';

export async function linkHandler(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const discordId = url.searchParams.get('discordId');
	if (!discordId) return new Response('Missing discordId parameter', { status: 400 });

	const linkID = crypto.randomUUID();
	await env.links.put(linkID, discordId, { expirationTtl: 60 * 5 }); // Link valid for 5 minutes

	const callbackUrl = new URL(`${url.origin}/auth/callback`);

	const microsoftLoginUrl = new URL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize');
	microsoftLoginUrl.searchParams.set('client_id', await env.azureClientId.get());
	microsoftLoginUrl.searchParams.set('response_type', 'code');
	microsoftLoginUrl.searchParams.set('redirect_uri', callbackUrl.href);
	microsoftLoginUrl.searchParams.set('scope', 'XboxLive.signin');
	microsoftLoginUrl.searchParams.set('state', linkID);

	return Response.redirect(microsoftLoginUrl.toString(), 302);

	return new Response(`Linking Discord ID: ${discordId}`, { status: 200 });
}

export async function callbackHandler(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state) return new Response('Missing code or state parameter', { status: 400 });

	const discordIdPromise = env.links.get(state);

	const xboxLiveResponsePromise = fetchXboxLiveToken(code);

	const discordId = await discordIdPromise;
	if (!discordId) return new Response('Invalid or expired link', { status: 400 });

	const xboxLiveResponse = await xboxLiveResponsePromise;

	if (!xboxLiveResponse.ok) return handleMicrosoftError((await xboxLiveResponse.json()) as MicrosoftErrorResponse);

	const xboxLiveData: XboxLiveTokenResponse = await xboxLiveResponse.json();
	const xboxToken = xboxLiveData.DisplayClaims.xui[0].uhs; // User hash from Xbox Live token response

	const xstsResponse = await fetchXSTSToken(xboxToken);

	if (!xstsResponse.ok) return handleMicrosoftError((await xstsResponse.json()) as MicrosoftErrorResponse);

	const xstsData: XSTSTokenResponse = await xstsResponse.json();
	const xstsToken = xstsData.Token;

	if (xboxLiveData.DisplayClaims.xui[0].uhs !== xstsData.DisplayClaims.xui[0].uhs) {
		return new Response('User hash mismatch between Xbox Live and XSTS tokens', { status: 500 });
	}
	const xboxUserHash = xboxLiveData.DisplayClaims.xui[0].uhs;

	const minecraftResponse = await fetchMinecraftToken(xboxToken, xstsToken);

	if (!minecraftResponse.ok) return handleMicrosoftError((await minecraftResponse.json()) as MicrosoftErrorResponse);

	const minecraftData: MinecraftTokenResponse = await minecraftResponse.json();

	const MinecraftProfileResponse = await fetchMinecraftProfile(minecraftData.access_token);

	if (!MinecraftProfileResponse.ok) return new Response('Failed to fetch Minecraft profile', { status: 500 });

	patchUser(env, discordId, {
		xboxAccounts: [
			{
				xboxUserHash,
				minecraftAccount: await MinecraftProfileResponse.json(),
			},
		],
	});

	return new Response(`Successfully linked your Minecraft account`, { status: 200 });
}

async function fetchXboxLiveToken(authCode: string): Promise<Response> {
	const xboxLiveEndpoint = 'https://user.auth.xboxlive.com/user/authenticate';
	const xboxRequestBody = {
		Properties: {
			AuthMethod: 'RPS',
			SiteName: 'user.auth.xboxlive.com',
			RpsTicket: `d=${authCode}`,
		},
		RelyingParty: 'http://auth.xboxlive.com',
		TokenType: 'JWT',
	};
	const response = fetch(xboxLiveEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(xboxRequestBody),
	});
	return response;
}

async function fetchXSTSToken(xboxToken: string): Promise<Response> {
	const xstsEndpoint = 'https://xsts.auth.xboxlive.com/xsts/authorize';
	const xstsRequestBody = {
		Properties: {
			SandboxId: 'RETAIL',
			UserTokens: [xboxToken],
		},
		RelyingParty: 'rp://api.minecraftservices.com/',
		TokenType: 'JWT',
	};
	const response = fetch(xstsEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(xstsRequestBody),
	});
	return response;
}

function handleMicrosoftError(error: MicrosoftErrorResponse): Response {
	switch (error.XErr) {
		case XboxLiveErrorCodes.AccountBanned:
			return new Response('Your account is banned from Xbox Live.', { status: 403 });
		case XboxLiveErrorCodes.AccountNoXbox:
			return new Response('No Xbox profile found for this Microsoft account.', { status: 404 });
		case XboxLiveErrorCodes.AccountCountryBanned:
			return new Response('Your account is banned in your country.', { status: 403 });
		case XboxLiveErrorCodes.AccountNeedsAdultVerificationSK:
		case XboxLiveErrorCodes.AccountNeedsAdultVerificationSK2:
			return new Response('Your account needs adult verification. Please verify your account on the Microsoft website.', { status: 403 });
		case XboxLiveErrorCodes.AccountChild:
			return new Response('Child accounts cannot be linked. Please use an adult Microsoft account.', { status: 403 });
		default:
			return new Response(`An unknown error occurred: ${error.Message} \n Please Try again later`, { status: 500 });
	}
}

async function fetchMinecraftToken(userHash: string, xstsToken: string): Promise<Response> {
	const minecraftEndpoint = 'https://api.minecraftservices.com/authentication/login_with_xbox';
	const minecraftRequestBody = {
		identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
	};
	const response = fetch(minecraftEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(minecraftRequestBody),
	});
	return response;
}

async function fetchMinecraftProfile(accessToken: string): Promise<Response> {
	const profileEndpoint = 'https://api.minecraftservices.com/minecraft/profile';
	const response = fetch(profileEndpoint, {
		method: 'GET',
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	return response;
}
