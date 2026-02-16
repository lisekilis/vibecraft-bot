export * from './command';

export interface GuildConfig {
	moderatorRoleID?: string;
}

export const defaultConfig: GuildConfig = {
	moderatorRoleID: undefined,
};
