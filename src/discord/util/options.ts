import { APIApplicationCommandInteractionDataOption, ApplicationCommandOptionType, InteractionType } from 'discord-api-types/v10';

export function findOption<OptionType extends ApplicationCommandOptionType, Name extends string>(
	options: APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand>[],
	name: Name,
	type: OptionType,
) {
	return options.find((option) => option.name === name && option.type === type) as
		| (APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand> & { name: Name; type: OptionType })
		| undefined;
}
