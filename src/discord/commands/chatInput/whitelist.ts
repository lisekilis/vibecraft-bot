import { ApplicationCommandType } from 'discord-api-types/v10';
import { command } from '.';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'whitelist',
		description: 'Manage the whitelist for the server',
		type: ApplicationCommandType.ChatInput,
	},
	execute: async (interaction, env) => {
		return {
			type: 4,
			data: {
				content: 'This command is not implemented yet.',
			},
		};
	},
});
