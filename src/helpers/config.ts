import { defaultConfig, GuildConfig } from '../types';

export async function patchConfig(env: Env, guildID: string, config: Partial<GuildConfig>): Promise<void> {
	const existingConfig = JSON.parse((await env.config.get(guildID)) || JSON.stringify(defaultConfig));

	const newConfig = { ...existingConfig, ...config };

	await env.config.put(guildID, JSON.stringify(newConfig));
}
