import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord-api-types/v10';
import { command, subcommand, subcommandGroup } from '.';
import { ephemeralResponse, fuckoffResponse, messageResponse } from '../../util/responses';
import { verifyAdmin } from '../../util/verify';
import { isGuildInteraction } from 'discord-api-types/utils';
import { getGuildConfig, patchGuildConfig } from '../../../helpers/config';
import { hasPrivilegedAccess } from '../../../helpers/user';

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
		if (!isGuildInteraction(interaction)) return ephemeralResponse('This command can only be used in a server');

		const subcommandOptions =
			interaction.data.options[0].type == ApplicationCommandOptionType.SubcommandGroup
				? interaction.data.options[0].options[0].options
				: interaction.data.options[0].options;

		const guild = getGuildConfig(env, interaction.guild_id);

		if (!verifyAdmin(interaction.member) || !(await hasPrivilegedAccess(interaction.member.user.id, guild)))
			return ephemeralResponse('You do not have permission to use this command');

		const role = subcommandOptions?.find((option) => option.name === 'role');

		if (!role || role.type !== ApplicationCommandOptionType.Role) return ephemeralResponse('Please provide a valid role');

		await patchGuildConfig(env, interaction.guild_id, { moderatorRoleID: role.value });

		return ephemeralResponse(`Moderator role set to <@&${role.value}>`);
	},
});
const adminSubcommand = subcommand({
	data: {
		name: 'admin',
		description: 'Manage admin privileges',
		type: ApplicationCommandOptionType.Subcommand,
		options: [
			{
				name: 'user',
				description: 'The user you wish to manage admin privileges for',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'action',
				description: 'The action to perform',
				type: ApplicationCommandOptionType.String,
				choices: [
					{
						name: 'grant',
						value: 'grant',
					},
					{
						name: 'revoke',
						value: 'revoke',
					},
					{
						name: 'view',
						value: 'view',
					},
				],
				required: false,
			},
		],
	},
	execute: async (interaction, env) => {
		if (!isGuildInteraction(interaction)) return ephemeralResponse('This command can only be used in a server');

		const guildConfigPromise = getGuildConfig(env, interaction.guild_id);

		const subcommandOptions =
			interaction.data.options[0].type == ApplicationCommandOptionType.SubcommandGroup
				? interaction.data.options[0].options[0].options
				: interaction.data.options[0].options;

		const guild = getGuildConfig(env, interaction.guild_id);

		if (!verifyAdmin(interaction.member) || !(await hasPrivilegedAccess(interaction.member.user.id, guild)))
			return ephemeralResponse('You do not have permission to use this command');

		const targetUser = subcommandOptions?.find((option) => option.name === 'user');
		const action = subcommandOptions?.find((option) => option.name === 'action');

		if (!targetUser || targetUser.type !== ApplicationCommandOptionType.User) return ephemeralResponse('Invalid User!');
		const actionValue = action && action.type == ApplicationCommandOptionType.String ? action.value : 'view';

		if (targetUser.value === interaction.member.user.id) return ephemeralResponse(`You can't manage your own admin privileges`);

		const guildConfig = await guildConfigPromise;
		let responseMessage: string;

		const hasAdmin = guildConfig.admins?.includes(targetUser.value);

		switch (actionValue) {
			case 'grant':
				if (!hasAdmin) {
					guildConfig.admins?.push(targetUser.value);
					responseMessage = `Granted <@${targetUser.value}> admin privileges`;
				} else responseMessage = `<@${targetUser.value}> already has admin privileges`;
				break;
			case 'revoke':
				if (hasAdmin) {
					guildConfig.admins = guildConfig.admins?.filter((userId) => userId !== targetUser.value);
					responseMessage = `Revoked <@${targetUser.value}>'s admin privileges`;
				} else responseMessage = `<@${targetUser.value}> does not have admin privileges`;
				break;
			default:
				responseMessage = hasAdmin
					? `<@${targetUser.value}> has admin privileges`
					: `<@${targetUser.value}> does not have admin privileges`;
				break;
		}
		await patchGuildConfig(env, interaction.guild_id, guildConfig);
		return messageResponse(responseMessage);
	},
});

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
	subcommands: [adminSubcommand],
});
