import {
	APIApplicationCommandInteractionDataSubcommandGroupOption,
	APIApplicationCommandInteractionDataSubcommandOption,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionData,
} from 'discord-api-types/v10';

interface APIChatInputApplicationSubcommandInteractionData extends Omit<APIChatInputApplicationCommandInteractionData, 'options'> {
	options: APIApplicationCommandInteractionDataSubcommandOption[];
}
// const text: APIChatInputApplicationSubcommandInteraction = {
// 	data: {
// 		options,
// 	},
// };
// const text2: APIInteraction = {
// 	type: InteractionType.ApplicationCommand,
// 	data: {
// 		options: [] as APIApplicationCommandInteractionDataSubcommandOption[],
// 	},
// };

interface APIChatInputApplicationGroupSubcommandInteractionData extends Omit<APIChatInputApplicationCommandInteractionData, 'options'> {
	options: APIApplicationCommandInteractionDataSubcommandGroupOption[];
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
