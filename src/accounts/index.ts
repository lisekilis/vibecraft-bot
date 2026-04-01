import { patchUser } from '../helpers/user';
import {
	MicrosoftErrorResponse,
	MinecraftOwnershipResponse,
	MinecraftTokenResponse,
	XboxLiveErrorCodes,
	XboxLiveTokenResponse,
	XboxProfileResponse,
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

	console.log(`Received callback with code: ${code} and state: ${state} getting discordId from KV store...`);

	const discordIdPromise = env.links.get(state);

	const xboxLiveResponsePromise = fetchXboxLiveToken(code);

	const discordId = await discordIdPromise;
	if (!discordId) return new Response('Invalid or expired link', { status: 400 });

	console.log(`Got discordId: ${discordId} from KV store, fetching Xbox Live token...`);

	const xboxLiveResponse = await xboxLiveResponsePromise;

	if (!xboxLiveResponse.ok) return handleMicrosoftError(await parseMicrosoftErrorResponse(xboxLiveResponse));

	console.log('Successfully fetched Xbox Live token, processing response...');

	const xboxLiveData: XboxLiveTokenResponse = await xboxLiveResponse.json();
	const xboxToken = xboxLiveData.DisplayClaims.xui[0].uhs; // User hash from Xbox Live token response

	const xstsResponse = await fetchXSTSToken(xboxToken);

	if (!xstsResponse.ok) return handleMicrosoftError(await parseMicrosoftErrorResponse(xstsResponse));

	console.log('Successfully fetched XSTS token, processing response...');

	const xstsData: XSTSTokenResponse = await xstsResponse.json();
	const xstsToken = xstsData.Token;

	if (xboxLiveData.DisplayClaims.xui[0].uhs !== xstsData.DisplayClaims.xui[0].uhs) {
		return new Response('User hash mismatch between Xbox Live and XSTS tokens', { status: 500 });
	}
	const xboxUserHash = xboxLiveData.DisplayClaims.xui[0].uhs;

	const xboxProfilePromise = fetchXboxProfile(xboxUserHash, xstsToken);

	const minecraftResponse = await fetchMinecraftToken(xboxToken, xstsToken);

	if (!minecraftResponse.ok) return handleMicrosoftError(await parseMicrosoftErrorResponse(minecraftResponse));

	const minecraftData: MinecraftTokenResponse = await minecraftResponse.json();

	const xboxProfileResponse = await xboxProfilePromise;

	if (!xboxProfileResponse.ok) return handleMicrosoftError(await parseMicrosoftErrorResponse(xboxProfileResponse));

	const xboxProfileData: XboxProfileResponse = await xboxProfileResponse.json();

	// Minecraft ownership required after this point
	console.log('Successfully fetched Xbox profile, checking Minecraft ownership...');

	const hasMinecraft = await checkMinecraftOwnership(minecraftData.access_token);

	if (!hasMinecraft) {
		patchUser(env, discordId, {
			xboxAccounts: [
				{
					xboxUserHash,
					xboxUserName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'Gamertag')?.value || 'Unknown',
					xboxProfilePicture: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayPicRaw')?.value || '',
				},
			],
		});
		return new Response('Microsoft account linked, but no Minecraft ownership found. Please purchase Minecraft and try linking again.', {
			status: 200,
		});
	}

	console.log('Successfully verified Minecraft ownership, fetching Minecraft profile...');
	const MinecraftProfileResponse = await fetchMinecraftProfile(minecraftData.access_token);

	if (!MinecraftProfileResponse.ok) return new Response('Failed to fetch Minecraft profile', { status: 500 });

	console.log('Successfully fetched Minecraft profile, linking accounts in KV store...');

	patchUser(env, discordId, {
		xboxAccounts: [
			{
				xboxUserHash,
				xboxUserName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'Gamertag')?.value || 'Unknown',
				xboxProfilePicture: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayPicRaw')?.value || '',
				minecraftAccount: await MinecraftProfileResponse.json(),
			},
		],
	});

	console.log('Successfully linked Microsoft account with Minecraft ownership to Discord ID:', discordId);

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

async function fetchXboxProfile(xboxUserHash: string, xstsToken: string): Promise<Response> {
	const profileEndpoint = 'https://profile.xboxlive.com/users/me/profile/settings';
	const response = fetch(profileEndpoint, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'x-xbl-contract-version': '2',
			Authorization: `XBL3.0 x=${xboxUserHash};${xstsToken}`,
		},
	});
	return response;
}

function parseMicrosoftErrorResponse(response: Response): Promise<MicrosoftErrorResponse> {
	console.log('Parsing Microsoft error response with status:', response.status, response.statusText);

	return response.json() as Promise<MicrosoftErrorResponse>;
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
			console.error('Unknown Microsoft error:', error);
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

async function checkMinecraftOwnership(minecraftAccessToken: string): Promise<boolean> {
	const mojangPublicKey =
		'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtz7jy4jRH3psj5AbVS6W\nNHjniqlr/f5JDly2M8OKGK81nPEq765tJuSILOWrC3KQRvHJIhf84+ekMGH7iGlO\n4DPGDVb6hBGoMMBhCq2jkBjuJ7fVi3oOxy5EsA/IQqa69e55ugM+GJKUndLyHeNnX6RzRzDT4tX/i68WJikwL8rR8Jq49aVJlIEFT6F+1rDQdU2qcpfT04CBYLM5gMxE\nfWRl6u1PNQixz8vSOv8pA6hB2DU8Y08VvbK7X2ls+BiS3wqqj3nyVWqoxrwVKiXR\nkIqIyIAedYDFSaIq5vbmnVtIonWQPeug4/0spLQoWnTUpXRZe2/+uAKN1RY9mmaB\npRFV/Osz3PDOoICGb5AZ0asLFf/qEvGJ+di6Ltt8/aaoBuVw+7fnTw2BhkhSq1S/\nva6LxHZGXE9wsLj4CN8mZXHfwVD9QG0VNQTUgEGZ4ngf7+0u30p7mPt5sYy3H+Fm\nsWXqFZn55pecmrgNLqtETPWMNpWc2fJu/qqnxE9o2tBGy/MqJiw3iLYxf7U+4le4\njM49AUKrO16bD1rdFwyVuNaTefObKjEMTX9gyVUF6o7oDEItp5NHxFm3CqnQRmch\nHsMs+NxEnN4E9a8PDB23b4yjKOQ9VHDxBxuaZJU60GBCIOF9tslb7OAkheSJx5Xy\nEYblHbogFGPRFU++NrSQRX0CAwEAAQ==';

	const ownershipResponse = await fetchMinecraftOwnership(minecraftAccessToken);

	if (!ownershipResponse.ok) {
		console.error('Failed to check Minecraft ownership:', await ownershipResponse.text());
		return false;
	}

	const ownershipData = (await ownershipResponse.json()) as MinecraftOwnershipResponse;
	if (!ownershipData.items || ownershipData.items.length === 0) {
		return false; // No Minecraft ownership found
	}

	return true; // Minecraft ownership exists
}

async function fetchMinecraftOwnership(minecraftAccessToken: string): Promise<Response> {
	const ownershipEndpoint = 'https://api.minecraftservices.com/entitlements/mcstore';
	const response = fetch(ownershipEndpoint, {
		method: 'GET',
		headers: { Authorization: `Bearer ${minecraftAccessToken}` },
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
