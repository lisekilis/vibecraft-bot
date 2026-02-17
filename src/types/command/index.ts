import {
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	APIMessageComponentInteraction,
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
}

export interface ChatInputCommand extends BaseCommand<ChatInputCommandData<APIApplicationCommandOption>> {
	execute: ChatInputCommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface ChatInputCommandParentWithSubcommands extends BaseCommand<ChatInputCommandData<APIApplicationCommandSubcommandOption>> {
	execute: ChatInputCommandParentWithSubcommandsExecute;
	subcommands: Subcommand[];
	subcommandGroups?: never;
}

export interface ChatInputCommandParentWithSubcommandGroups extends BaseCommand<
	ChatInputCommandData<APIApplicationCommandSubcommandGroupOption>
> {
	execute: ChatInputCommandParentWithSubcommandGroupsExecute;
	subcommands?: never;
	subcommandGroups: SubcommandGroup[];
}

export interface ChatInputCommandParentWithBoth extends BaseCommand<ChatInputCommandData<APIApplicationCommandOption>> {
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
	execute: ChatInputCommandParentExecute;
	subcommands?: Subcommand[];
	subcommandGroups?: SubcommandGroup[];
}

export interface UserCommand extends BaseCommand<UserCommandData> {
	execute: UserCommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface MessageCommand extends BaseCommand<MessageCommandData> {
	execute: MessageCommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface ActivityCommand extends BaseCommand<ActivityCommandData> {
	execute: ActivityCommandExecute;
}

export interface Subcommand extends BaseCommand<APIApplicationCommandSubcommandOption> {
	execute: ChatInputSubcommandExecute;
	executeComponent?: ComponentExecute<APIMessageComponentInteraction>;
}

export interface SubcommandGroup extends BaseCommand<APIApplicationCommandSubcommandGroupOption> {
	subcommands: Subcommand[];
}
