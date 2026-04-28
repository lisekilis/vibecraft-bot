import {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteractionDataSubcommandGroupOption,
	APIApplicationCommandInteractionDataSubcommandOption,
	APIAutocompleteApplicationCommandInteractionData,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionData,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionType,
} from 'discord-api-types/v10';

interface APIChatInputApplicationSubcommandInteractionData extends Omit<APIChatInputApplicationCommandInteractionData, 'options'> {
	options: APIApplicationCommandInteractionDataSubcommandOption<InteractionType.ApplicationCommand>[];
}

interface APIChatInputApplicationGroupSubcommandInteractionData extends Omit<APIChatInputApplicationCommandInteractionData, 'options'> {
	options: APIApplicationCommandInteractionDataSubcommandGroupOption<InteractionType.ApplicationCommand>[];
}

export interface APIChatInputApplicationSubcommandInteraction extends Omit<APIChatInputApplicationCommandInteraction, 'data'> {
	data: APIChatInputApplicationSubcommandInteractionData;
}

export interface APIChatInputApplicationGroupSubcommandInteraction extends Omit<APIChatInputApplicationCommandInteraction, 'data'> {
	data: APIChatInputApplicationGroupSubcommandInteractionData;
}

export type APIChatInputApplicationCommandParentInteraction =
	| APIChatInputApplicationSubcommandInteraction
	| APIChatInputApplicationGroupSubcommandInteraction;

interface APIChatInputApplicationSubcommandAutocompleteInteractionData extends Omit<
	APIAutocompleteApplicationCommandInteractionData,
	'options'
> {
	options: APIApplicationCommandInteractionDataSubcommandOption<InteractionType.ApplicationCommandAutocomplete>[]; //APIApplicationCommandInteractionDataSubcommandGroupOption<Type>[]
}

interface APIChatInputApplicationGroupSubcommandAutocompleteInteractionData extends Omit<
	APIAutocompleteApplicationCommandInteractionData,
	'options'
> {
	options: APIApplicationCommandInteractionDataSubcommandGroupOption<InteractionType.ApplicationCommandAutocomplete>[];
}

export interface APIChatInputApplicationSubcommandAutocompleteInteraction extends Omit<
	APIApplicationCommandAutocompleteInteraction,
	'data'
> {
	data: APIChatInputApplicationSubcommandAutocompleteInteractionData;
}

export interface APIChatInputApplicationGroupSubcommandAutocompleteInteraction extends Omit<
	APIApplicationCommandAutocompleteInteraction,
	'data'
> {
	data: APIChatInputApplicationGroupSubcommandAutocompleteInteractionData;
}

export type APIChatInputApplicationCommandParentAutocompleteInteraction =
	| APIChatInputApplicationSubcommandAutocompleteInteraction
	| APIChatInputApplicationGroupSubcommandAutocompleteInteraction;
