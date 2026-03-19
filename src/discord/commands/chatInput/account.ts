import {
	APIContainerComponent,
	APIInteractionResponse,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	InteractionResponseType,
	MessageFlags,
} from 'discord-api-types/v10';
import { command, subcommand } from '.';
import { autocompleteResponse, messageResponse } from '../../util/responses';
import { getUser } from '../../../helpers/user';

const add = subcommand({
	data: {
		name: 'add',
		description: 'Add your Minecraft account to your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction, env, ctx, reqUrl) => {
		const origin = reqUrl.origin;
		const user = interaction.member?.user || interaction.user;
		const userID = user!.id;
		const linkUrl = `${origin}/link?discordId=${userID}`;

		const component: APIContainerComponent = {
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: 'To link your Minecraft account, please click the button below.',
				},
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							label: 'Link Account',
							style: ButtonStyle.Link,
							url: linkUrl,
						},
					],
				},
			],
		};

		const res: APIInteractionResponse = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				components: [component],
				flags: MessageFlags.Ephemeral,
			},
		};
		return res;
	},
	executeComponent: async (interaction, env, ctx, reqUrl) => {
		return messageResponse('This command is not implemented yet');
	},
});

const remove = subcommand({
	data: {
		name: 'remove',
		description: 'Remove your Minecraft account from your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
		options: [
			{
				name: 'account',
				description: 'The Minecraft account to remove',
				type: ApplicationCommandOptionType.String,
				required: true,
				autocomplete: true,
				choices: [], // Choices will be populated dynamically based on the user's linked accounts
				// The autocomplete handler will need to fetch the user's linked accounts and return them as choices
				// Each choice's value can be the unique identifier of the linked account (e.g., Minecraft UUID)
			},
		],
	},
	executeAutocomplete: async (interaction, env, ctx, reqUrl) => {
		const user = await getUser(env, interaction.member?.user.id || interaction.user!.id);
		const accounts = user?.xboxAccounts;
		const choices = accounts?.map((account) => ({
			name: 'test',
			value: account.xboxUserHash,
		}));
		return autocompleteResponse(choices);
	},
	execute: async (interaction) => {
		return messageResponse('This command is not implemented yet');
	},
});

const view = subcommand({
	data: {
		name: 'view',
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
		contexts: [InteractionContextType.Guild, InteractionContextType.BotDM],
	},
	subcommands: [add, remove, view],
});
