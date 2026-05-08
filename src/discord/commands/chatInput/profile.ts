import { ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse } from '../../util/responses';
import { findOption } from '../../util/options';
import { getXboxAccount } from '../../../helpers/user';
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

		const xboxAccount = await getXboxAccount(env, userId);
		if (!xboxAccount) return messageResponse("This user doesn't have any linked Xbox accounts.");

		const embed = createProfileEmbed(xboxAccount, discordUser);
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [embed],
			},
		};
	},
});
