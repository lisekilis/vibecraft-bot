import {
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	APIMessageComponentInteraction,
	ApplicationCommandType,
} from 'discord-api-types/v10';
import { ChatInputCommandData, UserCommandData, MessageCommandData, ActivityCommandData } from './data';
import {
	ChatInputCommandExecute,
	UserCommandExecute,
	MessageCommandExecute,
	ActivityCommandExecute,
	ChatInputSubcommandExecute,
	ChatInputCommandParentExecute,
	ChatInputCommandParentWithSubcommandsExecute,
	ChatInputCommandParentWithSubcommandGroupsExecute,
	ComponentExecute,
} from './execute';

export * from './data';
export * from './execute';
export * from './parameters';
export * from './interaction';

/** Union type of all Command Interfaces */
export type Command = ChatInputCommand | ChatInputCommandParent | UserCommand | MessageCommand | ActivityCommand;

/**  Base used for creation of Command Interfaces */
export interface BaseCommand<CommandData> {
	/** Data used for registration of the Command */
	data: CommandData;
	/** The type of command, used for type narrowing */
	type: CommandData extends APIApplicationCommandOption ? never : ApplicationCommandType;
	/** Optional component execution function */
	executeComponent?: CommandData extends ActivityCommandData ? never : ComponentExecute<APIMessageComponentInteraction>;
}

export interface ChatInputCommand extends BaseCommand<ChatInputCommandData<APIApplicationCommandOption>> {
	type: ApplicationCommandType.ChatInput;
	execute: ChatInputCommandExecute;
}

export interface ChatInputCommandParentWithSubcommands extends BaseCommand<ChatInputCommandData<APIApplicationCommandSubcommandOption>> {
	type: ApplicationCommandType.ChatInput;
	execute: ChatInputCommandParentWithSubcommandsExecute;
	subcommands: Subcommand[];
	subcommandGroups?: never;
}

export interface ChatInputCommandParentWithSubcommandGroups extends BaseCommand<
	ChatInputCommandData<APIApplicationCommandSubcommandGroupOption>
> {
	type: ApplicationCommandType.ChatInput;
	execute: ChatInputCommandParentWithSubcommandGroupsExecute;
	subcommands?: never;
	subcommandGroups: SubcommandGroup[];
}

export interface ChatInputCommandParentWithBoth extends BaseCommand<ChatInputCommandData<APIApplicationCommandOption>> {
	type: ApplicationCommandType.ChatInput;
	execute: ChatInputCommandParentWithSubcommandsExecute | ChatInputCommandParentWithSubcommandGroupsExecute;
	subcommands: Subcommand[];
	subcommandGroups: SubcommandGroup[];
}

// export type ChatInputCommandParent =
// 	| ChatInputCommandParentWithSubcommands
// 	| ChatInputCommandParentWithSubcommandGroups
// 	| ChatInputCommandParentWithBoth;

export interface ChatInputCommandParent extends BaseCommand<
	ChatInputCommandData<APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption>
> {
	type: ApplicationCommandType.ChatInput;
	execute: ChatInputCommandParentExecute;
	subcommands?: Subcommand[];
	subcommandGroups?: SubcommandGroup[];
}

export interface UserCommand extends BaseCommand<UserCommandData> {
	type: ApplicationCommandType.User;
	execute: UserCommandExecute;
}

export interface MessageCommand extends BaseCommand<MessageCommandData> {
	type: ApplicationCommandType.Message;
	execute: MessageCommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface ActivityCommand extends BaseCommand<ActivityCommandData> {
	type: ApplicationCommandType.PrimaryEntryPoint;
	execute: ActivityCommandExecute;
}

export interface Subcommand extends BaseCommand<APIApplicationCommandSubcommandOption> {
	execute: ChatInputSubcommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface SubcommandGroup extends BaseCommand<APIApplicationCommandSubcommandGroupOption> {
	subcommands: Subcommand[];
}
