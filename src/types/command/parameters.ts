import {
	APIApplicationCommandBasicOption,
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	ApplicationCommandType,
	EntryPointCommandHandlerType,
} from 'discord-api-types/v10';
import {
	ActivityCommandExecute,
	BaseCommandData,
	ChatInputCommandExecute,
	ChatInputSubcommandExecute,
	MessageCommandExecute,
	Subcommand,
	SubcommandGroup,
	UserCommandExecute,
} from '.';

export interface BaseCommandParameters<
	CommandType extends ApplicationCommandType,
	Options extends APIApplicationCommandOption[] | never = never,
> {
	data: BaseCommandData<CommandType, Options>;
}

export type CommandParameters =
	| ChatInputCommandParameters
	| ChatInputCommandParentParameters
	| UserCommandParameters
	| MessageCommandParameters
	| ActivityCommandParameters;

export interface ChatInputCommandParameters extends BaseCommandParameters<
	ApplicationCommandType.ChatInput,
	APIApplicationCommandBasicOption[]
> {
	execute: ChatInputCommandExecute;
}

export interface ChatInputCommandParentParameters extends BaseCommandParameters<ApplicationCommandType.ChatInput, never> {
	execute: never;
	subcommands?: Subcommand[];
	subcommandGroups?: SubcommandGroup[];
}

export interface UserCommandParameters extends BaseCommandParameters<ApplicationCommandType.User> {
	execute: UserCommandExecute;
}

export interface MessageCommandParameters extends BaseCommandParameters<ApplicationCommandType.Message> {
	execute: MessageCommandExecute;
}

export interface ActivityCommandParameters extends BaseCommandParameters<ApplicationCommandType.PrimaryEntryPoint> {
	/** Determines whether the interaction is handled by the app's interactions handler or by Discord */
	handler?: EntryPointCommandHandlerType;
	execute?: ActivityCommandExecute;
}

export interface BaseSubcommandParameters<
	Option extends APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption,
> {
	data: Option;
}

export interface SubcommandParameters extends BaseSubcommandParameters<APIApplicationCommandSubcommandOption> {
	execute: ChatInputSubcommandExecute;
}

export interface SubcommandGroupParameters extends BaseSubcommandParameters<APIApplicationCommandSubcommandGroupOption> {
	execute: never;
	subcommands: Subcommand[];
}
