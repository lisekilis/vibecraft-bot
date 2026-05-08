import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse } from '../../util/responses';
import { fixUserData } from '../../../helpers/user';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'fix-accounts',
		description: 'Fix linked accounts for all users (admin only)',
		type: ApplicationCommandType.ChatInput,
		contexts: [InteractionContextType.BotDM],
		integration_types: [ApplicationIntegrationType.UserInstall],
	},
	execute: async (interaction, env, ctx) => {
		const user = interaction.member?.user || interaction.user!;
		if (user.id !== (await env.globalAdmin.get().catch(() => null))) {
			return messageResponse('You do not have permission to use this command.');
		}
		const users = await env.users.list();
		ctx.waitUntil(
			Promise.all(
				users.keys.map(async (key) => {
					const userData = await env.users.get(key.name, { type: 'json' });
					if (!userData) return;
					const fixedData = fixUserData(userData);
					try {
						return await env.users.put(key.name, JSON.stringify(fixedData));
					} catch (err) {
						console.error('Error fixing user data for', key.name, JSON.stringify(err));
					}
				}),
			),
		);
		return messageResponse('Started fixing accounts. This may take a while.');
	},
});
