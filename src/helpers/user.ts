import { UserData, XboxUserData } from '../types';

export async function patchUser(env: Env, discordID: string, userData: Partial<UserData>): Promise<void> {
	const existingUser = JSON.parse((await env.users.get(discordID)) || `{}`);
	if (existingUser) {
		if (userData.xboxAccounts && existingUser.xboxAccounts) {
			// Merge Xbox accounts by xboxUserHash
			const mergedXboxAccounts = [...existingUser.xboxAccounts];
			for (const newAccount of userData.xboxAccounts) {
				const index = mergedXboxAccounts.findIndex((acc: XboxUserData) => acc.xboxUserHash === newAccount.xboxUserHash);
				if (index !== -1) {
					// Replace Minecraft account data if Xbox account already exists
					mergedXboxAccounts[index].minecraftAccount = newAccount.minecraftAccount;
					// If there are other fields in XboxUserData in the future, they should also be merged here
				} else {
					mergedXboxAccounts.push(newAccount);
				}
			}
			userData.xboxAccounts = mergedXboxAccounts;
			delete existingUser.xboxAccounts;
		}
	}
	const newUser = { ...existingUser, ...userData };

	await env.users.put(discordID, JSON.stringify(newUser));
}
