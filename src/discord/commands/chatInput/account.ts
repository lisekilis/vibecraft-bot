import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';
import { command, subcommand } from '.';
import { messageResponse } from '../../util/responses';
import { MessageComponent, MessageComponentTypes } from 'discord-interactions';

const add = subcommand({
	data: {
		name: 'Add',
		description: 'Add your Minecraft account to your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction) => {
		const component:MessageComponent = {
			type: MessageComponentTypes.
		}
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
