import {
	APIContainerComponent,
	APIEmbedImage,
	APIInteractionResponseChannelMessageWithSource,
	APILabelComponent,
	APIMessageTopLevelComponent,
	APIModalInteractionResponseCallbackComponent,
	APIModalSubmissionComponent,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	InteractionResponseType,
	MessageFlags,
	ModalSubmitLabelComponent,
} from 'discord-api-types/v10';
import { command, subcommand } from '.';
import { autocompleteResponse, messageResponse, pongResponse, requestResponse } from '../../util/responses';
import { deleteUserXboxAccount, getUser, getXboxAccount } from '../../../helpers/user';
import { findOption } from '../../util/options';
import { createProfileEmbed } from '../../util/profile';
import { ComponentID } from '../../util/components';

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
		const accountOption = findOption(interaction.data.options[0].options || [], 'account', ApplicationCommandOptionType.String);
		if (!accountOption) return messageResponse('No account specified to view.');

		const xboxAccount = await getXboxAccount(env, interaction.member?.user.id || interaction.user!.id, accountOption.value);
		if (!xboxAccount) return messageResponse('The specified account was not found in your linked accounts.');

		const embed = createProfileEmbed(xboxAccount, interaction.user || interaction.member?.user!);
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

const preferences = subcommand({
	data: {
		name: 'preferences',
		type: ApplicationCommandOptionType.Subcommand,
		description: 'Configure your profile preferences',
		options: [
			{
				name: 'account',
				description: 'Select the account you want to configure preferences for',
				type: ApplicationCommandOptionType.String,
				required: true,
				autocomplete: true,
				choices: [],
				// The autocomplete handler will need to fetch the user's linked accounts and return them as choices
			},
		],
	},
	execute: async (interaction, env) => {
		const discordUser = interaction.member?.user || interaction.user!;
		const selectedAccount = findOption(interaction.data.options[0].options || [], 'account', ApplicationCommandOptionType.String)?.value;
		if (!selectedAccount) return messageResponse('No account specified to configure.');

		const user = await getUser(env, discordUser.id);
		if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0)
			return messageResponse('No linked Xbox accounts found for your profile. Please link an account first using `/account add`.');
		const xboxAccount = await getXboxAccount(user, selectedAccount);

		const components: APIModalInteractionResponseCallbackComponent[] = [
			{
				type: ComponentType.Label,
				label: 'Account',
				description: 'The account you want to set preferences for',
				component: {
					type: ComponentType.StringSelect,
					custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'account')
						.setSubcommand('preferences')
						.setComponent('account')
						.toString(),
					options: user.xboxAccounts.map((account) => ({
						label: account.gamertag,
						value: account.xboxUserId,
						description: account.minecraftAccount ? `Minecraft username: ${account.minecraftAccount.name}` : undefined,
						default: account.xboxUserId === selectedAccount,
					})),
					disabled: true, // Disable the account select since the user has already selected an account to configure
				},
			},
		];

		if (xboxAccount?.minecraftAccount) {
			components.push({
				type: ComponentType.Label,
				label: 'Character Pose',
				description: 'Select a pose for your character on your profile',
				component: {
					type: ComponentType.StringSelect,
					custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'account')
						.setSubcommand('preferences')
						.setComponent('pose')
						.toString(),
					options: [],
				},
			});
		}

		return {
			type: InteractionResponseType.Modal,
			data: {
				title: 'Account Preferences',
				custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'account').setSubcommand('preferences').toString(),
				components,
			},
		};
	},
	executeAutocomplete: async (interaction, env) => {
		return accountAutocomplete(env, interaction.member?.user.id || interaction.user!.id);
	},
	executeComponent: async (interaction, env) => {
		return messageResponse('Profile configuration is not implemented yet. Please check back later.');
	},
	executeModalSubmit: async (interaction, env) => {
		const accountComponent = interaction.data.components.find(
			(component) =>
				component.type === ComponentType.Label &&
				component.component.type == ComponentType.StringSelect &&
				new ComponentID(component.component.custom_id).componentName === 'account',
		) as (ModalSubmitLabelComponent & { component: { type: ComponentType.StringSelect } }) | undefined;
		if (!accountComponent) return messageResponse('No account specified to configure.');

		const selectedAccount = accountComponent.component.values[0];

		if (!selectedAccount) return messageResponse('No account specified to configure.');

		const user = await getUser(env, interaction.member?.user.id || interaction.user!.id);
		if (!user || !user.xboxAccounts || user.xboxAccounts.length === 0)
			return messageResponse('No linked Xbox accounts found for your profile. Please link an account first using `/account add`.');
		const xboxAccount = await getXboxAccount(user, selectedAccount);
		if (!xboxAccount) return messageResponse('The specified account was not found in your linked accounts.');

		if (xboxAccount.minecraftAccount) {
			const poseComponent = interaction.data.components.find(
				(component) => component.type === ComponentType.Label && new ComponentID(component.component.custom_id).componentName === 'pose',
			) as APIContainerComponent | undefined;
			if (!poseComponent) return messageResponse('No pose component found in the submitted modal.');
		}

		return messageResponse('Profile configuration is not implemented yet. Please check back later.');
	},
});

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'account',
		description: 'Manage your linked Minecraft accounts',
		type: ApplicationCommandType.ChatInput,
	},
	subcommands: [add, remove, view, preferences],
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
