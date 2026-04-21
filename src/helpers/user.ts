import { UserData, XboxUserData } from '../types';

export async function patchUser(env: Env, discordID: string, userData: Partial<UserData>): Promise<void> {
	const existingUser: UserData = JSON.parse((await env.users.get(discordID)) || `{}`);
	let newUser: UserData = { ...existingUser, ...userData };
	if (existingUser) {
		if (userData.xboxAccounts) {
			const existingXboxAccounts = existingUser.xboxAccounts || [];
			const newXboxAccounts = userData.xboxAccounts.filter(
				(newAcc) => !existingXboxAccounts.some((existingAcc) => existingAcc.xboxUserHash === newAcc.xboxUserHash),
			);
			newUser.xboxAccounts = [...existingXboxAccounts, ...newXboxAccounts];
		}
	}
	console.log('Patching user', discordID, 'with data', newUser);
	await env.users.put(discordID, JSON.stringify(newUser));
}

export async function deleteUser(env: Env, discordID: string): Promise<void> {
	await env.users.delete(discordID);
}

export async function deleteUserXboxAccount(env: Env, discordID: string, xboxUserHash: string): Promise<void> {
	const existingUser = JSON.parse((await env.users.get(discordID)) || `{}`) as UserData;
	if (!existingUser || !existingUser.xboxAccounts) return;
	existingUser.xboxAccounts = existingUser.xboxAccounts.filter((acc: XboxUserData) => acc.xboxUserHash !== xboxUserHash);
	await env.users.put(discordID, JSON.stringify(existingUser));
}

export async function getUser(env: Env, discordID: string): Promise<UserData | null> {
	const userData = await env.users.get(discordID);
	if (!userData) return null;
	return JSON.parse(userData);
}
