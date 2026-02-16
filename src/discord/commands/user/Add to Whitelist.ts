import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';
import { command } from '.';

export default command({
	type: ApplicationCommandType.User,
	data: {
		name: 'Add to Whitelist',
		description: '',
		type: ApplicationCommandType.User,
		contexts: [InteractionContextType.Guild],
	},
	execute: async (interaction) => {
		return {
			type: 4,
			data: {
				content: 'This command is not implemented yet.',
			},
		};
	},
});
