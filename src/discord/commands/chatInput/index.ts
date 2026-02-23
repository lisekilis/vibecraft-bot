import {
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	ApplicationCommandOptionType,
	ApplicationCommandType,
} from 'discord-api-types/v10';
import {
	ActivityCommand,
	ChatInputCommand,
	ChatInputCommandBasicParameters,
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
} from '../../../types';
import { invalidInteractionResponse } from '../../util/responses';

export function command(command: ChatInputCommandBasicParameters): ChatInputCommand;
export function command(command: ChatInputCommandParentParameters): ChatInputCommandParent;
export function command(
	command: ChatInputCommandBasicParameters | ChatInputCommandParentParameters,
): ChatInputCommand | ChatInputCommandParent {
	if (!('execute' in command)) {
		return parentCommand(command as ChatInputCommandParentParameters);
	}
	const exec = command.execute;
	return {
		...command,
	} as ChatInputCommand;
}

export function commandOld(command: CommandParameters): Command {
	switch (command.type) {
		case ApplicationCommandType.ChatInput: {
			if (!('execute' in command)) {
				return parentCommand(command);
			}
			const exec = command.execute;
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
	const parentCommand = command as unknown as ChatInputCommandParent;
	parentCommand.data.options = [];
	if (parentCommand.subcommands) {
		const subcommandOptions = completeSubcommandOptions(parentCommand.subcommands);
		parentCommand.data.options.push(...subcommandOptions);
	}
	if (parentCommand.subcommandGroups) {
		const subcommandGroupOptions = completeSubcommandGroupOptions(parentCommand.subcommandGroups);
		parentCommand.data.options.push(...subcommandGroupOptions);
	}
	parentCommand.execute = async (interaction, env, ctx, reqUrl) => {
		if (interaction.data.options[0].type === ApplicationCommandOptionType.Subcommand) {
			const subcommandName = interaction.data.options[0].name;
			const subcommand = parentCommand.subcommands?.find((sc) => sc.data.name === subcommandName);
			if (subcommand) {
				return subcommand.execute(interaction, env, ctx, reqUrl);
			}
			return invalidInteractionResponse();
		}
		const subcommandGroupName = interaction.data.options[0].name;
		const subcommandGroup = parentCommand.subcommandGroups?.find((scg) => scg.data.name === subcommandGroupName);
		if (subcommandGroup) {
			const subcommandName = interaction.data.options[0].options[0].name;
			const subcommand = subcommandGroup.subcommands.find((sc) => sc.data.name === subcommandName);
			if (subcommand) {
				return subcommand.execute(interaction, env, ctx, reqUrl);
			}
			return invalidInteractionResponse();
		}
		return invalidInteractionResponse();
	};
	return parentCommand;
}

export function subcommand(command: SubcommandParameters): Subcommand {
	return command as Subcommand;
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
	} as SubcommandGroup;
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
