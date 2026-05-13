import { defaultConfig, GuildConfig } from '../types';

export async function patchGuildConfig(env: Env, guildID: string, config: Partial<GuildConfig>): Promise<void> {
	const existingConfig = await getGuildConfig(env, guildID);

	const newConfig = { ...existingConfig, ...config };

	await env.config.put(guildID, JSON.stringify(newConfig));
}

export async function getGuildConfig(env: Env, guildID: string): Promise<GuildConfig> {
	const config = await env.config.get<GuildConfig>(guildID, { type: 'json' });
	if (!config) {
		return defaultConfig;
	}
	return config;
}
