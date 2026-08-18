import { defaultUserData, GuildConfig, MinecraftServerData, MinecraftUserData, SkinRenderPose, UserData, XboxUserData } from '../types';
import { getMinecraftServer } from './server';

export async function patchUser(env: Env, discordID: string, userData: Partial<UserData>): Promise<void> {
	const existingUser: UserData = JSON.parse((await env.users.get(discordID)) || `{}`);
	let newUser: UserData = { ...existingUser, ...userData, id: discordID };
	if (existingUser) {
		if (userData.xboxAccounts) {
			const existingXboxAccounts = existingUser.xboxAccounts || [];
			const newXboxAccounts = userData.xboxAccounts.filter(
				(newAcc) => !existingXboxAccounts.some((existingAcc) => existingAcc.xboxUserId === newAcc.xboxUserId),
			);
			newUser.xboxAccounts = [...existingXboxAccounts, ...newXboxAccounts];
		}
	}
	if (newUser.defaultXboxAccountId && !newUser.xboxAccounts?.some((acc) => acc.xboxUserId === newUser.defaultXboxAccountId))
		newUser.defaultXboxAccountId = undefined;

	if (newUser.xboxAccounts && newUser.xboxAccounts.length > 0 && !newUser.defaultXboxAccountId)
		newUser.defaultXboxAccountId = newUser.xboxAccounts[0].xboxUserId;

	console.log('Patching user', discordID, 'with data', newUser);
	await env.users.put(discordID, JSON.stringify(newUser));
}
export function fixUserData(userData: Partial<UserData>): UserData {
	const fixedXboxAccounts = userData.xboxAccounts
		? userData.xboxAccounts.map(fixXboxUserData).filter((acc): acc is XboxUserData => acc !== undefined)
		: defaultUserData.xboxAccounts;
	return {
		...defaultUserData,
		...userData,
		xboxAccounts: fixedXboxAccounts,
		defaultXboxAccountId: fixedXboxAccounts
			? fixedXboxAccounts.some((acc) => acc.xboxUserId === userData.defaultXboxAccountId)
				? userData.defaultXboxAccountId
				: fixedXboxAccounts[0].xboxUserId
			: undefined,
	};
}
function fixXboxUserData(xboxUserData: Partial<XboxUserData>): XboxUserData | undefined {
	const defaultXboxUserData: XboxUserData = {
		appDisplayName: '',
		gameDisplayName: '',
		gamertag: '',
		gameProfilePicture: '',
		preferences: {
			skinRenderPose: SkinRenderPose.Default,
		},
		xboxUserId: '',
	};
	if (
		!xboxUserData.xboxUserId ||
		!xboxUserData.appDisplayName ||
		!xboxUserData.gameDisplayName ||
		!xboxUserData.gamertag ||
		!xboxUserData.gameProfilePicture
	)
		return undefined;
	return {
		...defaultXboxUserData,
		...xboxUserData,
		preferences: {
			...defaultXboxUserData.preferences,
			...xboxUserData.preferences,
		},
		minecraftAccount: xboxUserData.minecraftAccount ? fixMinecraftUserData(xboxUserData.minecraftAccount) : undefined,
	};
}

function fixMinecraftUserData(minecraftUserData: Partial<MinecraftUserData>): MinecraftUserData | undefined {
	const defaultMinecraftUserData: MinecraftUserData = {
		id: '',
		name: '',
		skins: [],
		capes: [],
	};
	if (!minecraftUserData.id || !minecraftUserData.name) return undefined;
	return {
		...defaultMinecraftUserData,
		...minecraftUserData,
	};
}

export async function deleteUser(env: Env, discordID: string): Promise<void> {
	await env.users.delete(discordID);
}

export async function deleteUserXboxAccount(env: Env, discordID: string, xboxUserId: string): Promise<void> {
	const existingUser = JSON.parse((await env.users.get(discordID)) || `{}`) as UserData;
	if (!existingUser || !existingUser.xboxAccounts) return;
	existingUser.xboxAccounts = existingUser.xboxAccounts.filter((acc: XboxUserData) => acc.xboxUserId !== xboxUserId);
	if (existingUser.defaultXboxAccountId === xboxUserId) {
		if (existingUser.xboxAccounts.length > 0) {
			existingUser.defaultXboxAccountId = existingUser.xboxAccounts[0].xboxUserId;
		} else {
			existingUser.defaultXboxAccountId = undefined;
		}
	}
	await env.users.put(discordID, JSON.stringify(existingUser));
}

export async function getUser(env: Env, discordID: string): Promise<UserData | null> {
	return env.users.get<UserData>(discordID, { type: 'json' });
}

/* Gets the Xbox account for a user. If xboxUserId is provided, it will return the account with that ID, otherwise it will return the default account. */
export async function getXboxAccount(user: UserData, xboxUserId?: string): Promise<XboxUserData | undefined>;
export async function getXboxAccount(user: Promise<UserData>, xboxUserId?: string): Promise<XboxUserData | undefined>;
export async function getXboxAccount(env: Env, discordID: string, xboxUserId?: string): Promise<XboxUserData | undefined>;
export async function getXboxAccount(
	envOrUser: Env | UserData | Promise<UserData>,
	discordOrXboxID: string | undefined,
	xboxUserId?: string,
): Promise<XboxUserData | undefined> {
	const user =
		envOrUser instanceof Promise
			? await envOrUser
			: envOrUser instanceof Object && 'users' in envOrUser
				? await getUser(envOrUser, discordOrXboxID!)
				: (envOrUser as UserData);
	if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0) return undefined;

	const accountId = xboxUserId || user.defaultXboxAccountId;

	if (accountId) {
		const xboxAccount = user.xboxAccounts.find((account) => account.xboxUserId === accountId);
		if (xboxAccount) return xboxAccount;
		return user.xboxAccounts[0];
	}
	return user.xboxAccounts[0];
}

/**
 * This function is used to check if the used has privelaged access to the app's management features (e.g. add their servers and stuff)
 * @param userId
 * @param guild
 */
export async function hasPrivilegedAccess(userId: string, guild: Promise<GuildConfig>): Promise<boolean>;
export async function hasPrivilegedAccess(userId: string, guild: GuildConfig): Promise<boolean>;
export async function hasPrivilegedAccess(userId: string, guild: GuildConfig | Promise<GuildConfig>): Promise<boolean> {
	const resolvedGuild = guild instanceof Promise ? await guild : guild;
	return resolvedGuild.admins?.includes(userId) || false;
}

export function isWhitelistedForServer(user: UserData, server: MinecraftServerData): boolean {
	if (!server.whitelist || server.whitelist.length === 0) return false;
	return server.whitelist.includes(user.id);
}

export async function getWhitelistedServers(env: Env, user: UserData): Promise<MinecraftServerData[]> {
	const userServers = user.servers || [];
	const servers = await Promise.all(userServers.map((serverId) => getMinecraftServer(env, serverId)));
	return servers.filter((server) => server !== null && isWhitelistedForServer(user, server)) as MinecraftServerData[];
}

export async function getAdminServers(env: Env, user: UserData): Promise<MinecraftServerData[]> {
	const userServers = user.servers || [];
	const servers = await Promise.all(userServers.map((serverId) => getMinecraftServer(env, serverId)));
	return servers.filter((server) => server !== null && server.admins?.includes(user.id)) as MinecraftServerData[];
}
