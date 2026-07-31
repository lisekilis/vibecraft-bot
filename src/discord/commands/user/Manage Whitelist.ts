import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, InteractionResponseType } from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse } from '../../util/responses';
import { getAdminServers, getUser, hasPrivilegedAccess } from '../../../helpers/user';
import { getGuildConfig } from '../../../helpers/config';
import { WhitelistModal } from '../../util/whitelist';
import { ComponentID } from '../../util/components';

const commandData = {
	type: ApplicationCommandType.User,
	name: 'Manage Whitelist',
	description: '',
	integration_types: [ApplicationIntegrationType.UserInstall],
	contexts: [InteractionContextType.Guild],
};

export default command({
	type: ApplicationCommandType.User,
	data: {
		type: ApplicationCommandType.User,
		name: 'Manage Whitelist',
		description: '',
		integration_types: [ApplicationIntegrationType.UserInstall],
		contexts: [InteractionContextType.Guild],
	},
	execute: async (interaction, env) => {
		const discordUser = interaction.member?.user || interaction.user!;
		const userPromise = getUser(env, discordUser.id);
		const targetUser = getUser(env, interaction.data.target_id);
		const targetDiscordUser = interaction.data.resolved.users[interaction.data.target_id];

		const guild = getGuildConfig(env, interaction.guild_id!);

		if (!(await hasPrivilegedAccess(discordUser.id, guild))) return messageResponse('You do not have permission to use this command.');

		const user = await userPromise;
		if (!user) return messageResponse('User data not found.');

		const servers = await getAdminServers(env, user);

		const modalData = new WhitelistModal(new ComponentID(ApplicationCommandType.User, 'Manage Whitelist').toString(),servers, user)

		return {
			type: InteractionResponseType.Modal,
			data: modalData.modalData,
		};

		return messageResponse('This command is not implemented yet.');
	},
	executeModalSubmit: async (interaction, env) => {





		return{
			type: InteractionResponseType.Modal
			data:
		}
	}
});
