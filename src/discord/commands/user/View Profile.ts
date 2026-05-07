import { APIUser, ApplicationCommandType, InteractionResponseType, RouteBases, Routes } from 'discord-api-types/v10';
import { command } from '.';
import { getUser } from '../../../helpers/user';
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

		const user = await getUser(env, userId);

		if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0)
			return messageResponse("This user doesn't have any linked Xbox accounts.");

		const discrodUser = discordUser as APIUser;
		const xboxAccount = user.defaultXboxAccountId
			? user.xboxAccounts?.find((acc) => acc.xboxUserId === user.defaultXboxAccountId) || user.xboxAccounts[0]
			: user.xboxAccounts[0];
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
