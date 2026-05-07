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

const moderatorRoleCommand = subcommand({
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
		if (interaction.data.options[0].type !== ApplicationCommandOptionType.Subcommand) return ephemeralResponse('Invalid subcommand');

		if (!isGuildInteraction(interaction)) return ephemeralResponse('This command can only be used in a server');

		if (!verifyAdmin(interaction.member)) return ephemeralResponse('You do not have permission to use this command');

		const role = interaction.data.options[0].options?.find((option) => option.name === 'role');

		if (!role || role.type !== ApplicationCommandOptionType.Role) return ephemeralResponse('Please provide a valid role');

		await patchConfig(env, interaction.guild_id, { moderatorRoleID: role.value });

		return ephemeralResponse(`Moderator role set to <@&${role.value}>`);
	},
});

// const profileCommand = subcommand({
// 	data: {
// 		name: 'profile',
// 		type: ApplicationCommandOptionType.Subcommand,
// 		description: 'Configure your profile settings',
// 	},
// 	execute: async (interaction, env) => {
// 		const discordUser = interaction.member?.user || interaction.user!;
// 		const user = await getUser(env, discordUser.id);
// 		if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0)
// 			return messageResponse('No linked Xbox accounts found for your profile. Please link an account first using `/account add`.');

// 		return {
// 			type: InteractionResponseType.Modal,
// 			data: {
// 				title: 'Profile Configuration',
// 				custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'config').setSubcommand('profile').toString(),
// 				components: [
// 					{
// 						type: ComponentType.Label,
// 						label: 'Default Account',
// 						description: 'Select your default account to show on your profile',
// 						component: {
// 							type: ComponentType.StringSelect,
// 							custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'config')
// 								.setSubcommand('profile')
// 								.setComponent('default')
// 								.toString(),
// 							options: user.xboxAccounts.map((acc) => ({
// 								label: acc.gamertag,
// 								value: acc.xboxUserId,
// 								default: acc.xboxUserId === user.defaultXboxAccountId,
// 								description: acc.minecraftAccount ? `Minecraft username: ${acc.minecraftAccount.name}` : undefined,
// 							})),
// 						},
// 					},
// 					{
// 						type: ComponentType.Label,
// 						label: 'Character Pose',
// 						description: 'Select a pose for your character on your profile (applies if you have a linked Minecraft account)',
// 						component: {
// 							type: ComponentType.StringSelect,
// 							custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'config')
// 								.setSubcommand('profile')
// 								.setComponent('pose')
// 								.toString(),
// 							options: [],
// 						},
// 					},
// 				],
// 			},
// 		};
// 	},
// 	executeComponent: async (interaction, env) => {
// 		return messageResponse('Profile configuration is not implemented yet. Please check back later.');
// 	},
// });

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
			subcommands: [moderatorRoleCommand],
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
	subcommands: [],
});
