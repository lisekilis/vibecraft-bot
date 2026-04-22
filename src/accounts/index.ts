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
	const clientId = env.azureClientId.get();
	const url = new URL(request.url);
	const discordId = url.searchParams.get('discordId');
	if (!discordId) return new Response('Missing discordId parameter', { status: 400 });

	const linkID = crypto.randomUUID();
	const codeVerifier = generateCodeVerifier();
	const codeChallengePromise = generateCodeChallenge(codeVerifier);

	const authData = {
		discordId,
		codeVerifier,
	};
	await env.links.put(linkID, JSON.stringify(authData), { expirationTtl: 60 * 5 }); // Link valid for 5 minutes

	const callbackUrl = new URL(`${url.origin}/auth/callback`);

	// Generate the Microsoft login URL with PKCE parameters

	const microsoftLoginUrl = new URL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize');
	microsoftLoginUrl.searchParams.set('client_id', await clientId);
	microsoftLoginUrl.searchParams.set('response_type', 'code');
	microsoftLoginUrl.searchParams.set('redirect_uri', callbackUrl.href);
	microsoftLoginUrl.searchParams.set('scope', 'XboxLive.signin');
	microsoftLoginUrl.searchParams.set('code_challenge_method', 'S256');
	microsoftLoginUrl.searchParams.set('code_challenge', await codeChallengePromise);
	microsoftLoginUrl.searchParams.set('state', linkID);

	return Response.redirect(microsoftLoginUrl.toString(), 302);

	return new Response(`Linking Discord ID: ${discordId}`, { status: 200 });
}

export async function callbackHandler(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state) return new Response('Missing code or state parameter', { status: 400 });

	const authDataPromise = env.links.get(state);

	const authData = await authDataPromise;
	if (!authData) return new Response('Invalid or expired link', { status: 400 });

	const { discordId, codeVerifier } = JSON.parse(authData);

	const redirectUri = `${url.origin}/auth/callback`;

	const tokenResponse = await exchangeCodeForToken(redirectUri, env.azureClientId.get(), env.azureClientSecret.get(), code, codeVerifier);

	if (!tokenResponse.ok) {
		console.error('Failed to exchange code for token:', await tokenResponse.text());
		return new Response('Failed to exchange code for token', { status: 500 });
	}

	const tokenData = (await tokenResponse.json()) as any;
	const accessToken = tokenData.access_token;

	if (!accessToken) {
		console.error('No access token found in token response:', tokenData);
		return new Response('No access token found in token response', { status: 500 });
	}
	const xboxLiveResponsePromise = fetchXboxLiveToken(accessToken);

	console.log(`Got discordId: ${discordId} from KV store, fetching Xbox Live token...`);

	const xboxLiveResponse = await xboxLiveResponsePromise;

	if (!xboxLiveResponse.ok) return handleMicrosoftError(parseMicrosoftErrorResponse(xboxLiveResponse));

	console.log('Successfully fetched Xbox Live token, processing response...');

	const xboxLiveData: XboxLiveTokenResponse = await xboxLiveResponse.json();
	const xboxToken = xboxLiveData.Token; // User hash from Xbox Live token response

	const minecraftxstsResponse = await fetchXSTSToken(xboxToken, 'rp://api.minecraftservices.com/');
	const xboxServicesxstsResponse = await fetchXSTSToken(xboxToken, 'http://xboxlive.com');

	if (!minecraftxstsResponse.ok) return handleMicrosoftError(parseMicrosoftErrorResponse(minecraftxstsResponse));
	if (!xboxServicesxstsResponse.ok) return handleMicrosoftError(parseMicrosoftErrorResponse(xboxServicesxstsResponse));

	console.log('Successfully fetched XSTS tokens, processing responses...');

	console.log('Xboxlive response:', JSON.stringify(await xboxLiveResponse.text()));
	const minecraftXstsData: XSTSTokenResponse = await minecraftxstsResponse.json();
	const xboxServicesXstsData: XSTSTokenResponse = await xboxServicesxstsResponse.json();
	const minecraftXstsToken = minecraftXstsData.Token;
	const xboxServicesXstsToken = xboxServicesXstsData.Token;

	if (xboxLiveData.DisplayClaims.xui[0].uhs !== minecraftXstsData.DisplayClaims.xui[0].uhs) {
		return new Response('User hash mismatch between Xbox Live and XSTS tokens', { status: 500 });
	}
	const xboxUserHash = xboxLiveData.DisplayClaims.xui[0].uhs;
	const xboxUserId = xboxLiveData.DisplayClaims.xui[0].xid;

	const xboxProfilePromise = fetchXboxProfile(xboxUserHash, xboxServicesXstsToken, xboxUserId);

	const minecraftResponse = await fetchMinecraftToken(xboxUserHash, minecraftXstsToken);

	if (!minecraftResponse.ok) return handleMinecraftError(minecraftResponse);

	const minecraftData: MinecraftTokenResponse = await minecraftResponse.json();

	const xboxProfileResponse = await xboxProfilePromise;

	if (!xboxProfileResponse.ok) return handleMicrosoftError(parseMicrosoftErrorResponse(xboxProfileResponse));

	const xboxProfileData: XboxProfileResponse = await xboxProfileResponse.json();

	// Minecraft ownership required after this point
	console.log('Successfully fetched Xbox profile, checking Minecraft ownership...');

	const hasMinecraft = await checkMinecraftOwnership(minecraftData.access_token);

	if (!hasMinecraft) {
		await patchUser(env, discordId, {
			xboxAccounts: [
				{
					xboxUserHash,
					gameDisplayName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayName')?.value || 'Unknown',
					appDisplayName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'AppDisplayName')?.value || 'Unknown',
					gamertag: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'Gamertag')?.value || 'Unknown',
					gameProfilePicture: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayPicRaw')?.value || '',
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

	await patchUser(env, discordId, {
		xboxAccounts: [
			{
				xboxUserHash,
				gameDisplayName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayName')?.value || 'Unknown',
				appDisplayName: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'AppDisplayName')?.value || 'Unknown',
				gamertag: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'Gamertag')?.value || 'Unknown',
				gameProfilePicture: xboxProfileData.profileUsers[0].settings.find((setting) => setting.id === 'GameDisplayPicRaw')?.value || '',
				minecraftAccount: await MinecraftProfileResponse.json(),
			},
		],
	});

	console.log('Successfully linked Microsoft account with Minecraft ownership to Discord ID:', discordId);

	return new Response(`Successfully linked your Minecraft account`, { status: 200 });
}
async function exchangeCodeForToken(
	redirectUri: string,
	clientId: Promise<string>,
	clientSecret: Promise<string>,
	code: string,
	codeVerifier: string,
) {
	const microsoftTokenUrl = new URL('https://login.microsoftonline.com/consumers/oauth2/v2.0/token');
	const params = new URLSearchParams();
	params.append('client_id', await clientId);
	params.append('scope', 'XboxLive.signin');
	params.append('code', code);
	params.append('redirect_uri', redirectUri);
	params.append('grant_type', 'authorization_code');
	params.append('code_verifier', codeVerifier);
	params.append('client_secret', await clientSecret);

	const res = fetch(microsoftTokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params,
	});
	return res;
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

async function fetchXSTSToken(xboxToken: string, relyingParty: string): Promise<Response> {
	const xstsEndpoint = 'https://xsts.auth.xboxlive.com/xsts/authorize';
	const xstsRequestBody = {
		RelyingParty: relyingParty,
		TokenType: 'JWT',
		Properties: {
			SandboxId: 'RETAIL',
			UserTokens: [xboxToken],
		},
	};
	const response = fetch(xstsEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(xstsRequestBody),
	});
	return response;
}

async function fetchXboxProfile(xboxUserHash: string, xstsToken: string, xboxUserId: string): Promise<Response> {
	// https://learn.microsoft.com/en-us/gaming/gdk/docs/reference/live/rest/uri/profilev2/atoc-reference-profiles?view=gdk-2510
	const profileEndpoint = 'https://profile.xboxlive.com/users/batch/profile/settings';
	const body = {
		userIds: [xboxUserId],
		settings: ['GameDisplayName', 'AppDisplayName', 'Gamertag', 'GameDisplayPicRaw'],
	};
	const response = fetch(profileEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-xbl-contract-version': '2',
			Authorization: `XBL3.0 x=${xboxUserHash};${xstsToken}`,
		},
		body: JSON.stringify(body),
	});
	return response;
}

function parseMicrosoftErrorResponse(response: Response): Promise<MicrosoftErrorResponse> {
	console.log('Parsing Microsoft error response with status:', response.status, response.statusText, 'for url:', response.url);
	const res = response.json().catch((err) => {
		console.error('Failed to parse Microsoft error response as JSON:', err);
		return {
			Identity: '',
			XErr: 0,
			Message: 'Unknown error',
			Redirect: '',
		} as MicrosoftErrorResponse;
	});
	if (!res) {
		console.error('Microsoft error response is empty or invalid');
		return Promise.resolve({
			Identity: '',
			XErr: 0,
			Message: 'Unknown error',
			Redirect: '',
		} as MicrosoftErrorResponse);
	}
	return res as Promise<MicrosoftErrorResponse>;
}

async function handleMicrosoftError(error: Promise<MicrosoftErrorResponse>): Promise<Response> {
	const resolvedError = await error;
	switch (resolvedError.XErr) {
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
			console.error('Unknown Microsoft error:', resolvedError);
			return new Response(`An unknown error occurred: ${resolvedError.Message} \n Please Try again later`, { status: 500 });
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
async function handleMinecraftError(error: Response): Promise<Response> {
	console.error('Failed an API call to Minecraft services:', await error.text());
	return new Response('Failed to verify Minecraft ownership. Please try linking again later.', { status: 500 });
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

function generateCodeVerifier(): string {
	return btoa(crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID())
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashBase64 = btoa(String.fromCharCode(...hashArray))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
	return hashBase64;
}
