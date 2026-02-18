import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';
import { command, subcommand } from '.';
import { messageResponse } from '../../util/responses';
import { ButtonStyleTypes, MessageComponent, MessageComponentTypes } from 'discord-interactions';

const add = subcommand({
	data: {
		name: 'Add',
		description: 'Add your Minecraft account to your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction, env, ctx, reqUrl) => {
		const origin = reqUrl.origin;
		const user = interaction.member?.user || interaction.user;
		const userID = user!.id;
		const linkUrl = `${origin}/link?discordId=${userID}`;

		const component: MessageComponent = {
			type: MessageComponentTypes.CONTAINER,
			components: [
				{
					type: MessageComponentTypes.TEXT_DISPLAY,
					content: 'To link your Minecraft account, please click the button below and follow the instructions.',
				},
				{
					type: MessageComponentTypes.BUTTON,
					label: 'Link Account',
					style: ButtonStyleTypes.LINK,
					url: linkUrl,
				},
			],
		};
		return messageResponse('This command is not implemented yet');
	},
	executeComponent: async (interaction) => {
		return messageResponse('This command is not implemented yet');
	},
});

const remove = subcommand({
	data: {
		name: 'Remove',
		description: 'Remove your Minecraft account from your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction) => {
		return messageResponse('This command is not implemented yet');
	},
});

const view = subcommand({
	data: {
		name: 'View',
		description: 'View your linked Minecraft accounts',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction) => {
		return messageResponse('This command is not implemented yet');
	},
});

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'account',
		description: 'Manage your linked Minecraft accounts',
		type: ApplicationCommandType.ChatInput,
	},
	subcommands: [add, remove, view],
});
