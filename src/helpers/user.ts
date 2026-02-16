import { UserData } from '../types';

export async function patchUser(env: Env, discordID: string, userData: Partial<UserData>): Promise<void> {
	const existingUser = JSON.parse((await env.users.get(discordID)) || `{}`);

	const newUser = { ...existingUser, ...userData };

	await env.users.put(discordID, JSON.stringify(newUser));
}
