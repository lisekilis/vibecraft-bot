export * from './command';

export interface GuildConfig {
	moderatorRoleID?: string;
}

export const defaultConfig: GuildConfig = {
	moderatorRoleID: undefined,
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
