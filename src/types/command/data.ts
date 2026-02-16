import {
	APIApplicationCommandOption,
	ApplicationCommandType,
	ApplicationIntegrationType,
	EntryPointCommandHandlerType,
	InteractionContextType,
	Permissions,
} from 'discord-api-types/v10';
import { Command } from '.';

/** Base Command Data used for creation  of Command Data Interfaces */
export interface BaseCommandData<
	CommandType extends ApplicationCommandType,
	Options extends APIApplicationCommandOption[] | never = APIApplicationCommandOption[],
> {
	/**  1-32 character name */
	name: string;
	/** Description for CHAT_INPUT commands, 1-100 characters. Empty string for USER and MESSAGE commands */
	description: CommandType extends ApplicationCommandType.ChatInput
		? string
		: CommandType extends ApplicationCommandType.PrimaryEntryPoint
			? never
			: '';
	/** The type of command */
	type: CommandType;
	/** Set of permissions represented as a bit set */
	default_member_permissions?: Permissions;
	/** Indicates whether the command is age-restricted, defaults to false */
	nsfw?: Boolean;
	/** Installation contexts where the command is available, only for globally-scoped commands. Defaults to your app's configured contexts */
	integration_types?: ApplicationIntegrationType[];
	/** Interaction context(s) where the command can be used, only for globally-scoped commands. */
	contexts?: InteractionContextType[];
	/** Parameters for the command, max of 25 */
	options?: Options;
}

export interface ChatInputCommandData<OptionType extends APIApplicationCommandOption> extends BaseCommandData<
	ApplicationCommandType.ChatInput,
	OptionType[]
> {}

export interface UserCommandData extends BaseCommandData<ApplicationCommandType.User> {}

export interface MessageCommandData extends BaseCommandData<ApplicationCommandType.Message> {}

export interface ActivityCommandData extends BaseCommandData<ApplicationCommandType.PrimaryEntryPoint> {
	/** Determines whether the interaction is handled by the app's interactions handler or by Discord */
	handler?: EntryPointCommandHandlerType;
}
