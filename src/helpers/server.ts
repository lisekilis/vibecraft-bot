import { MinecraftServerData } from '../types';

export function getMinecraftServer(env: Env, serverID: string): Promise<MinecraftServerData | null> {
	return env.servers.get<MinecraftServerData>(serverID, { type: 'json' });
}

export function getMinecraftServerWhitelist(server: MinecraftServerData): string[] {
	return server.whitelist || [];
}

export function getMinecraftServerAdmins(server: MinecraftServerData): string[] {
	return server.admins || [];
}

export async function patchMinecraftServer(env: Env, serverID: string, serverData: Partial<MinecraftServerData>): Promise<void> {
	const existingServer = await getMinecraftServer(env, serverID);
	const newServer = { ...existingServer, ...serverData } as MinecraftServerData;
	return env.servers.put(serverID, JSON.stringify(newServer));
}
