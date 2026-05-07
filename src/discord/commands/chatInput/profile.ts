import { ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse } from '../../util/responses';
import { findOption } from '../../util/options';
import { getUser } from '../../../helpers/user';
import { createProfileEmbed } from '../../util/profile';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'profile',
		description: 'View your linked Minecraft accounts',
		type: ApplicationCommandType.ChatInput,
		options: [
			{
				type: ApplicationCommandOptionType.User,
				name: 'user',
				description: 'The user to view the profile of (defaults to yourself)',
				required: false,
			},
		],
	},
	execute: async (interaction, env) => {
		const userOption = findOption(interaction.data.options || [], 'user', ApplicationCommandOptionType.User);
		const discordUser = interaction.member?.user || interaction.user!;
		const userId = userOption ? userOption.value : discordUser.id;

		const user = await getUser(env, userId);
		if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0)
			return messageResponse('No linked Xbox accounts found for this user.');

		const xboxAccount = user.defaultXboxAccountId
			? user.xboxAccounts?.find((acc) => acc.xboxUserId === user.defaultXboxAccountId) || user.xboxAccounts[0]
			: user.xboxAccounts[0];
		if (!xboxAccount) return messageResponse('No linked Xbox accounts found for this user.');

		const embed = createProfileEmbed(xboxAccount, discordUser);
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
			},
		};
	},
});
