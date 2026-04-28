import {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandAutocompleteResponse,
	APIApplicationCommandInteraction,
	APIChatInputApplicationCommandInteraction,
	APIInteractionResponse,
	APIMessageApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIPrimaryEntryPointCommandInteraction,
	APIUserApplicationCommandInteraction,
} from 'discord-api-types/v10';
import {
	APIChatInputApplicationGroupSubcommandInteraction,
	APIChatInputApplicationSubcommandInteraction,
	APIChatInputApplicationCommandParentInteraction,
	APIChatInputApplicationCommandParentAutocompleteInteraction,
	APIChatInputApplicationSubcommandAutocompleteInteraction,
	APIChatInputApplicationGroupSubcommandAutocompleteInteraction,
} from '.';

export interface BaseCommandExecute<Interaction extends APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction> {
	(interaction: Interaction, env: Env, ctx: ExecutionContext, reqUrl: URL): Promise<APIInteractionResponse>;
}

export interface ChatInputCommandExecute extends BaseCommandExecute<APIChatInputApplicationCommandInteraction> {}

export interface UserCommandExecute extends BaseCommandExecute<APIUserApplicationCommandInteraction> {}

export interface MessageCommandExecute extends BaseCommandExecute<APIMessageApplicationCommandInteraction> {}

export interface ActivityCommandExecute extends BaseCommandExecute<APIPrimaryEntryPointCommandInteraction> {}

export type ChatInputSubcommandExecute = BaseCommandExecute<
	APIChatInputApplicationSubcommandInteraction | APIChatInputApplicationGroupSubcommandInteraction
>;

export interface ChatInputCommandParentExecute extends BaseCommandExecute<APIChatInputApplicationCommandParentInteraction> {}

export interface ChatInputCommandParentWithSubcommandsExecute extends BaseCommandExecute<APIChatInputApplicationSubcommandInteraction> {}

export interface ChatInputCommandParentWithSubcommandGroupsExecute extends BaseCommandExecute<APIChatInputApplicationGroupSubcommandInteraction> {}

export interface ChatInputCommandParentAutocompleteExecute extends BaseCommandExecute<APIChatInputApplicationCommandParentAutocompleteInteraction> {}

export interface ChatInputCommandParentWithSubcommandsAutocompleteExecute extends BaseCommandExecute<APIChatInputApplicationSubcommandAutocompleteInteraction> {}

export interface ChatInputCommandParentWithSubcommandGroupsAutocompleteExecute extends BaseCommandExecute<APIChatInputApplicationGroupSubcommandAutocompleteInteraction> {}

// export interface subcommands extends BaseCommandExecute<APIChatInputApplicationSubcommandInteraction> {}

// export interface ChatInputGroupSubcommandExecute extends BaseCommandExecute<APIChatInputApplicationGroupSubcommandInteraction> {}

export interface ComponentExecute<Interaction extends APIMessageComponentInteraction> {
	(interaction: Interaction, env: Env, ctx: ExecutionContext, reqUrl: URL): Promise<APIInteractionResponse>;
}

export interface AutocompleteExecute {
	(
		interaction: APIApplicationCommandAutocompleteInteraction,
		env: Env,
		ctx: ExecutionContext,
		reqUrl: URL,
	): Promise<APIApplicationCommandAutocompleteResponse>;
}
