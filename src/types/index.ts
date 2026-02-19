export * from './command';

export interface GuildConfig {
	moderatorRoleID: string;
	servers: mcServerData[];
}

export interface mcServerData {
	/**The unique identifier of the Minecraft server*/
	id: string;
	/**The name of the Minecraft server*/
	name: string;
	/**The IP address of the Minecraft server*/
	ip: string;
	/**The port number of the Minecraft server*/
	port: number;
	/**The version of the Minecraft server*/
	version: string;
	/**The status of the Minecraft server, e.g., ONLINE or OFFLINE*/
	status: string;
	/**The WebSocket URL for the Minecraft server*/
	socket: URL;
}

export const defaultConfig: GuildConfig = {
	moderatorRoleID: '',
	servers: [],
};

export interface UserData {
	xboxAccounts?: XboxUserData[];
}

export interface XboxUserData {
	xboxUserHash: string;
	minecraftAccount?: minecraftUserData;
}

export interface minecraftUserData {
	/**The unique identifier of the Minecraft account*/
	id: string;
	/**The username of the Minecraft account*/
	name: string;
	/**An array of skins associated with the Minecraft account*/
	skins: minecraftSkinData[];
	/**An array of capes associated with the Minecraft account*/
	capes: minecraftCapeData[];
}

export interface minecraftSkinData {
	/**The unique identifier of the skin*/
	id: string;
	/**The state of the skin, e.g., ACTIVE or INACTIVE*/
	state: string;
	/**The URL of the skin texture*/
	url: string;
	/**The variant of the skin, e.g., CLASSIC or SLIM*/
	variant: string;
	/**The alias of the skin, e.g., STEVE or ALEX*/
	alias: string;
}

export interface minecraftCapeData {
	/**The unique identifier of the cape*/
	id: string;
	/**The state of the cape, e.g., ACTIVE or INACTIVE*/
	state: string;
	/**The URL of the cape texture*/
	url: string;
	/**The alias of the cape, e.g., Migrator*/
	alias: string;
}
