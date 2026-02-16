import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord-api-types/v10';
import { command, subcommand, subcommandGroup } from '.';
import { ephemeralResponse } from '../../util/responses';
import { verifyAdmin } from '../../util/verify';
import { isGuildInteraction } from 'discord-api-types/utils';
import { patchConfig } from '../../../helpers/config';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'config',
		description: "Configure the bot's settings",
		type: ApplicationCommandType.ChatInput,
		contexts: [InteractionContextType.Guild],
		integration_types: [ApplicationIntegrationType.GuildInstall],
	},
	subcommandGroups: [
		subcommandGroup({
			data: {
				name: 'role',
				description: 'Manage roles for the server',
				type: ApplicationCommandOptionType.SubcommandGroup,
			},
			subcommands: [
				subcommand({
					data: {
						name: 'moderator',
						description: 'Set the moderator role for the server',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'role',
								description: 'The role to set as the moderator role',
								type: ApplicationCommandOptionType.Role,
								required: true,
							},
						],
					},
					execute: async (interaction, env) => {
						if (interaction.data.options[0].type !== ApplicationCommandOptionType.Subcommand) {
							return ephemeralResponse('Invalid subcommand');
						}

						if (!isGuildInteraction(interaction)) return ephemeralResponse('This command can only be used in a server');

						if (!verifyAdmin(interaction.member)) return ephemeralResponse('You do not have permission to use this command');

						const role = interaction.data.options[0].options?.find((option) => option.name === 'role');

						if (!role || role.type !== ApplicationCommandOptionType.Role) return ephemeralResponse('Please provide a valid role');

						await patchConfig(env, interaction.guild_id, { moderatorRoleID: role.value });

						return ephemeralResponse(`Moderator role set to <@&${role.value}>`);
					},
				}),
			],
		}),
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
