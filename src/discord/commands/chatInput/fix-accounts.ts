import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	InteractionResponseType,
	RouteBases,
	Routes,
} from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse, pongResponse, requestResponse } from '../../util/responses';
import { fixUserData } from '../../../helpers/user';
import { getDefaultAutoSelectFamily } from 'node:net';

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
		const deferredResponsePromise = requestResponse(interaction.id, interaction.token, {
			type: InteractionResponseType.DeferredChannelMessageWithSource,
		});
		const user = interaction.member?.user || interaction.user!;
		if (user.id !== (await env.globalAdmin.get().catch(() => null))) {
			return messageResponse('You do not have permission to use this command.');
		}
		console.log('Starting to fix accounts for all users');
		const users = await env.users.list();
		console.log(`Found ${users.keys.length} users to fix`);
		const deferredResponse = await deferredResponsePromise;
		const result = users.keys.map(async (key) => {
			console.log('Fixing account for user', key.name);
			const userData = await env.users.get(key.name, { type: 'json' });
			console.log('Fetched user data for', key.name, userData);
			if (!userData) return;
			const fixedData = fixUserData(userData);
			await env.users.put(key.name, JSON.stringify(fixedData));
			console.log('Finished fixing account for user', key.name);
		});

		const startedResponse = fetch(RouteBases.api + Routes.webhookMessage(interaction.application_id, interaction.token), {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				content: 'Started fixing accounts for all users. This may take a while...',
			}),
		});

		await startedResponse;
		await Promise.all(result);
		console.log('Finished fixing accounts for all users');
		await fetch(RouteBases.api + Routes.webhookMessage(interaction.application_id, interaction.token), {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				content: 'Finished fixing accounts for all users.',
			}),
		});
		return pongResponse();
	},
});
