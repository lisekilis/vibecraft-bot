export * from './command';

export interface GuildConfig {
	moderatorRoleID?: string;
}

export const defaultConfig: GuildConfig = {
	moderatorRoleID: undefined,
};

export interface UserData {
	minecraftUsername: string;
	minecraftUUID: string;
	xboxUUID: string;
}
