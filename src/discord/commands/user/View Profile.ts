import { APIUser, ApplicationCommandType, InteractionResponseType } from 'discord-api-types/v10';
import { command } from '.';
import { getXboxAccount } from '../../../helpers/user';
import { messageResponse } from '../../util/responses';
import { createProfileEmbed } from '../../util/profile';

export default command({
	type: ApplicationCommandType.User,
	data: {
		name: 'View Profile',
		description: '',
		type: ApplicationCommandType.User,
	},
	execute: async (interaction, env) => {
		const userId = interaction.data.target_id;
		const discordUser = interaction.data.resolved.users[userId];

		const discrodUser = discordUser as APIUser;
		const xboxAccount = await getXboxAccount(env, userId);
		if (!xboxAccount) return messageResponse("This user doesn't have any linked Xbox accounts.");

		const embed = createProfileEmbed(xboxAccount, discrodUser);

		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
			},
		};
	},
});
