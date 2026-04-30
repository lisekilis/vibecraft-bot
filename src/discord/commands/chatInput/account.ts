import {
	APIContainerComponent,
	APIEmbedImage,
	APIInteractionResponseChannelMessageWithSource,
	APIMessageTopLevelComponent,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	InteractionResponseType,
	MessageFlags,
} from 'discord-api-types/v10';
import { command, subcommand } from '.';
import { autocompleteResponse, messageResponse, pongResponse, requestResponse } from '../../util/responses';
import { deleteUserXboxAccount, getUser } from '../../../helpers/user';
import { findOption } from '../../util/options';
import { createProfileEmbed } from '../../../helpers/profile';

const add = subcommand({
	data: {
		name: 'add',
		description: 'Add your Minecraft account to your Discord account',
		type: ApplicationCommandOptionType.Subcommand,
	},
	execute: async (interaction, env, ctx, reqUrl) => {
		const origin = reqUrl.origin;
		const user = interaction.user || interaction.member?.user;
		const userID = user!.id;
		const linkUrl = `${origin}/link?discordId=${userID}`;

		const components: APIMessageTopLevelComponent[] = [
			{
				type: ComponentType.TextDisplay,
				content: 'To link your Minecraft account, please click the button below.',
			},
			{
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
			},
		];

		const res: APIInteractionResponseChannelMessageWithSource = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				components,
				flags: MessageFlags.Ephemeral + MessageFlags.IsComponentsV2,
			},
		};

		return res;
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
		return accountAutocomplete(env, interaction.member?.user.id || interaction.user!.id);
	},
	execute: async (interaction, env) => {
		const accountOption = findOption(interaction.data.options[0].options || [], 'account', ApplicationCommandOptionType.String);
		if (!accountOption) return messageResponse('No account specified to remove.');

		await deleteUserXboxAccount(env, interaction.member?.user.id || interaction.user!.id, accountOption.value);

		return messageResponse('The specified Minecraft account has been removed.');
	},
});

const view = subcommand({
	data: {
		name: 'view',
		description: 'View your linked Minecraft accounts',
		type: ApplicationCommandOptionType.Subcommand,
		options: [
			{
				name: 'account',
				description: 'The Minecraft account to view',
				type: ApplicationCommandOptionType.String,
				required: true,
				autocomplete: true,
				choices: [],
			},
			{
				name: 'ephemeral',
				description: 'Whether the response should be ephemeral (only visible to you)',
				type: ApplicationCommandOptionType.Boolean,
				required: false,
			},
		],
	},
	executeAutocomplete: async (interaction, env, ctx, reqUrl) => {
		return accountAutocomplete(env, interaction.member?.user.id || interaction.user!.id);
	},
	execute: async (interaction, env) => {
		const userDataPromise = getUser(env, interaction.member?.user.id || interaction.user!.id);
		console.log('Fetching user data for', interaction.member?.user.id || interaction.user!.id);
		const accountOption = findOption(interaction.data.options[0].options || [], 'account', ApplicationCommandOptionType.String);
		console.log('Account option:', JSON.stringify(accountOption));
		if (!accountOption) return messageResponse('No account specified to view.');

		const userData = await userDataPromise;

		if (!userData || !userData.xboxAccounts || userData.xboxAccounts.length === 0)
			return messageResponse('You have no linked Minecraft accounts.');
		const account = userData.xboxAccounts.find((account) => account.xboxUserId === accountOption.value);
		if (!account) return messageResponse('The specified account was not found in your linked accounts.');

		const embed = createProfileEmbed(account, interaction.user || interaction.member?.user!);
		console.log('Created embed:', JSON.stringify(embed));
		const flags = findOption(interaction.data.options[0].options || [], 'ephemeral', ApplicationCommandOptionType.Boolean)?.value
			? MessageFlags.Ephemeral
			: undefined;
		console.log('Response flags:', flags);

		const responseData: APIInteractionResponseChannelMessageWithSource = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: '', embeds: [embed], flags },
		};
		const response = requestResponse(interaction.id, interaction.token, responseData);
		console.log('Response from Discord:', JSON.stringify(await (await response).text()));
		return pongResponse();
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

async function accountAutocomplete(env: Env, userId: string) {
	const user = await getUser(env, userId);
	const accounts = user?.xboxAccounts;
	const choices = accounts?.map((account) => ({
		name: account.appDisplayName || account.gameDisplayName || account.gamertag || 'Unknown Account',
		value: account.xboxUserId,
	}));
	return autocompleteResponse(choices);
}
