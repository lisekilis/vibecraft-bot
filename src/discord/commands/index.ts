import {
	ApplicationIntegrationType,
	EntryPointCommandHandlerType,
	InteractionContextType,
	APIApplicationCommandOption,
	ApplicationCommandType,
} from 'discord-api-types/v10';

export function command() {}

type Command = ChatInputCommand | UserCommand | MessageCommand | ActivityCommand;

/** Base Command Data used for creation  */
interface BaseCommandData<CommandType extends ApplicationCommandType> {
	/**  1-32 character name */
	name: string;
	/** Description for CHAT_INPUT commands, 1-100 characters. Empty string for USER and MESSAGE commands */
	description: string;
	type: CommandType;
	/** Set of permissions represented as a bit set */
	default_member_permissions: string;
	/** Indicates whether the command is age-restricted, defaults to false */
	nsfw?: Boolean;
	/** Installation contexts where the command is available, only for globally-scoped commands. Defaults to your app's configured contexts */
	integration_types?: ApplicationIntegrationType[];
	/** Interaction context(s) where the command can be used, only for globally-scoped commands. */
	contexts?: InteractionContextType[];
}

interface ChatInputCommandData extends BaseCommandData<ApplicationCommandType.ChatInput> {
	/** Parameters for the command, max of 25 */
	options?: APIApplicationCommandOption[];
}

interface UserCommandData extends BaseCommandData<ApplicationCommandType.User> {
	options: never;
}

interface MessageCommandData extends BaseCommandData<ApplicationCommandType.Message> {
	options: never;
}

interface ActivityCommandData extends BaseCommandData<ApplicationCommandType.PrimaryEntryPoint> {
	options: never;
	/** Determines whether the interaction is handled by the app's interactions handler or by Discord */
	handler?: EntryPointCommandHandlerType;
}

/**  Base used for creation of Command Interfaces */
interface BaseCommand<CommandData> {
	/** Data used for registration of the Command */
	data: CommandData;
}

interface ChatInputCommand extends BaseCommand<ChatInputCommandData> {}

interface UserCommand extends BaseCommand<UserCommandData> {}

interface MessageCommand extends BaseCommand<MessageCommandData> {}

interface ActivityCommand extends BaseCommand<ActivityCommandData> {}
