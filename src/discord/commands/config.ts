import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord-api-types/v10';
import { command, subcommand, subcommandGroup } from '.';
import { messageResponse } from '../util/responses';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'config',
		description: "Configure the bot's settings",
		type: ApplicationCommandType.ChatInput,
		contexts: [InteractionContextType.Guild],
		integration_types: [ApplicationIntegrationType.GuildInstall],
	},
	subcommands: [
		subcommand({
			data: {
				name: 'moderator role',
				description: 'Set the moderator role for the server',
				type: ApplicationCommandOptionType.Subcommand,
			},
			execute: async (interaction, env) => {
				if (interaction.data.options[0].type !== ApplicationCommandOptionType.Subcommand) {
					return messageResponse('Invalid subcommand');
				}

				const role = interaction.data.options[0].options?.find((option) => option.name === 'role')?.value;
				if (!role) {
					return messageResponse('Please provide a valid role');
				}

				return messageResponse('This command is not implemented yet.');
			},
		}),
	],
	subcommandGroups: [
		subcommandGroup({
			data: {
				name: 'whitelist',
				description: 'Manage the whitelist for the server',
				type: ApplicationCommandOptionType.SubcommandGroup,
			},
			subcommands: [],
		}),
	],
});
