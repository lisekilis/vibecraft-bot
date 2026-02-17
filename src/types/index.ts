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
	xboxUUID: string;
	xboxGamertag: string;
	minecraftAccount?: minecraftUserData;
}

export interface minecraftUserData {
	minecraftUsername: string;
	minecraftUUID: string;
}
