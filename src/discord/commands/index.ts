import {
	APIApplicationCommandOption,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionResponseType,
} from 'discord-api-types/v10';
import {
	ActivityCommand,
	APIChatInputApplicationSubcommandInteraction,
	ChatInputCommand,
	ChatInputCommandParent,
	ChatInputCommandParentParameters,
	Command,
	CommandParameters,
	MessageCommand,
	Subcommand,
	SubcommandGroup,
	SubcommandGroupParameters,
	SubcommandParameters,
	UserCommand,
} from '../../types';
import { fuckoffResponse, invalidInteractionResponse } from '../responses';

export function command(command: CommandParameters): Command {
	switch (command.data.type) {
		case ApplicationCommandType.ChatInput: {
			if ('subcommands' in command || 'subcommandGroups' in command) {
				return parentCommand(command);
			}
			return {
				...command,
			} as ChatInputCommand;
		}
		case ApplicationCommandType.User:
			return {
				...command,
			} as UserCommand;
		case ApplicationCommandType.Message:
			return {
				...command,
			} as MessageCommand;
		case ApplicationCommandType.PrimaryEntryPoint:
			return {
				...command,
			} as ActivityCommand;
	}
}

function parentCommand(command: ChatInputCommandParentParameters): ChatInputCommandParent {
	const parentCommand = command as ChatInputCommandParent;
	parentCommand.data.options = [];
	if (parentCommand.subcommands) {
		const subcommandOptions = completeSubcommandOptions(parentCommand.subcommands);
		parentCommand.data.options.push(...subcommandOptions);
	}
	if (parentCommand.subcommandGroups) {
		const subcommandGroupOptions = completeSubcommandGroupOptions(parentCommand.subcommandGroups);
		parentCommand.data.options.push(...subcommandGroupOptions);
	}
	parentCommand.execute = async (interaction, env, ctx) => {
		if (interaction.data.options[0].type === ApplicationCommandOptionType.Subcommand) {
			const subcommandName = interaction.data.options[0].name;
			const subcommand = parentCommand.subcommands.find((sc) => sc.data.name === subcommandName);
			if (subcommand) {
				return subcommand.execute(interaction, env, ctx);
			}
			return invalidInteractionResponse();
		}
		const subcommandGroupName = interaction.data.options[0].name;
		const subcommandGroup = parentCommand.subcommandGroups.find((scg) => scg.data.name === subcommandGroupName);
		if (subcommandGroup) {
			const subcommandName = interaction.data.options[0].options[0].name;
			const subcommand = subcommandGroup.subcommands.find((sc) => sc.data.name === subcommandName);
			if (subcommand) {
				return subcommand.execute(interaction, env, ctx);
			}
			return invalidInteractionResponse();
		}
		return invalidInteractionResponse();
	};
	return parentCommand;
}

export function subcommand(command: SubcommandParameters): Subcommand {
	return command;
}

export function subcommandGroup(command: SubcommandGroupParameters): SubcommandGroup {
	return {
		...command,
		data: {
			name: command.data.name,
			type: ApplicationCommandOptionType.SubcommandGroup,
			description: command.data.description,
			options: completeSubcommandOptions(command.subcommands),
		},
	};
}

function completeSubcommandOptions(subcommands: Subcommand[]): APIApplicationCommandSubcommandOption[] {
	let options: APIApplicationCommandSubcommandOption[] = [];
	for (const subcommand of subcommands) {
		options.push(subcommand.data);
	}
	return options;
}
function completeSubcommandGroupOptions(
	subcommandGroups: SubcommandGroup[],
): APIApplicationCommandSubcommandGroupOption[] | APIApplicationCommandSubcommandGroupOption[] {
	let options = [];
	for (const subcommandGroup of subcommandGroups) {
		let subcommandOptions = completeSubcommandOptions(subcommandGroup.subcommands);
		subcommandGroup.data.options = subcommandOptions;
		options.push(subcommandGroup.data);
	}
	return options;
}
