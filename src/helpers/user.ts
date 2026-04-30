import { UserData, XboxUserData } from '../types';

export async function patchUser(env: Env, discordID: string, userData: Partial<UserData>): Promise<void> {
	const existingUser: UserData = JSON.parse((await env.users.get(discordID)) || `{}`);
	let newUser: UserData = { ...existingUser, ...userData };
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
	const userData = await env.users.get(discordID);
	if (!userData) return null;
	return JSON.parse(userData);
}
