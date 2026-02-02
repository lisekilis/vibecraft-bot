import {
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
} from '.';

export interface BaseCommandExecute<Interaction extends APIApplicationCommandInteraction> {
	(interaction: Interaction, env: Env, ctx: ExecutionContext): Promise<APIInteractionResponse>;
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

// export interface subcommands extends BaseCommandExecute<APIChatInputApplicationSubcommandInteraction> {}

// export interface ChatInputGroupSubcommandExecute extends BaseCommandExecute<APIChatInputApplicationGroupSubcommandInteraction> {}

export interface ComponentExecute<Interaction extends APIMessageComponentInteraction> {
	(interaction: Interaction, env: Env, ctx: ExecutionContext): Promise<APIInteractionResponse>;
}
