import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, InteractionResponseType } from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse, requestResponse } from '../../util/responses';
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
		const defferedResponse = requestResponse(interaction.id, interaction.token, {
			type: InteractionResponseType.DeferredChannelMessageWithSource,
		});
		const user = interaction.member?.user || interaction.user!;
		if (user.id !== (await env.globalAdmin.get().catch(() => null))) {
			return messageResponse('You do not have permission to use this command.');
		}
		console.log('Starting to fix accounts for all users');
		const users = await env.users.list();
		console.log(`Found ${users.keys.length} users to fix`);

		const result = Promise.all(
			users.keys.map(async (key) => {
				console.log('Fixing account for user', key.name);
				const userData = await env.users.get(key.name, { type: 'json' });
				console.log('Fetched user data for', key.name, userData);
				if (!userData) return;
				const fixedData = fixUserData(userData);
				try {
					return await env.users.put(key.name, JSON.stringify(fixedData));
				} catch (err) {
					console.error('Error fixing user data for', key.name, JSON.stringify(err));
				}
			}),
		);
		await defferedResponse;
		const startedResponse = requestResponse(
			interaction.id,
			interaction.token,
			messageResponse('Started fixing accounts for all users. This may take a while...'),
		);

		await startedResponse;
		await result;
		console.log('Finished fixing accounts for all users');
		return {
			type: InteractionResponseType.UpdateMessage,
			data: {
				content: 'Finished fixing accounts for all users.',
			},
		};
	},
});
