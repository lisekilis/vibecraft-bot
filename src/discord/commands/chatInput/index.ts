import {
	APIApplicationCommandInteraction,
	APIApplicationCommandSubcommandGroupOption,
	APIApplicationCommandSubcommandOption,
	APIInteraction,
	APIMessageComponentInteraction,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionType,
} from 'discord-api-types/v10';
import {
	ActivityCommand,
	ChatInputCommand,
	ChatInputCommandBasicParameters,
	ChatInputCommandParameters,
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
	parentCommand.execute = async (interaction, env, ctx) => {
		if (interaction.data.options[0].type === ApplicationCommandOptionType.Subcommand) {
			const subcommandName = interaction.data.options[0].name;
			const subcommand = parentCommand.subcommands?.find((sc) => sc.data.name === subcommandName);
			if (subcommand) {
				return subcommand.execute(interaction, env, ctx);
			}
			return invalidInteractionResponse();
		}
		const subcommandGroupName = interaction.data.options[0].name;
		const subcommandGroup = parentCommand.subcommandGroups?.find((scg) => scg.data.name === subcommandGroupName);
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

async function executeCommand(interaction: APIApplicationCommandInteraction, env: Env, ctx: ExecutionContext) {
	const commandName = interaction.data.name;
	const command = await importCommandModule(commandName);
	if (command) {
		return command.execute(interaction as any, env, ctx); //TODO: fix this any
	} else {
		return invalidInteractionResponse();
	}
}

function executeComponent(interaction: APIMessageComponentInteraction, env: Env, ctx: ExecutionContext) {
	const customId = interaction.data.custom_id;
	const commandName = customId.split(':')[0];
}

async function importCommandModule(commandName: string): Promise<Command | undefined> {
	try {
		// look for a file ending with commandName.ts or commandName.js
		// this allows for both TypeScript and JavaScript command files
		// and allows for easier development without needing to compile TypeScript

		return (await import(`./${commandName}.ts`)).default;
	} catch (tsError) {
		try {
			return (await import(`./${commandName}.js`)).default;
		} catch (jsError) {
			console.error(`Failed to import command module ${commandName}.ts:`, tsError);
			console.error(`Failed to import command module ${commandName}.js:`, jsError);
			throw new Error(`Command module ${commandName} not found.`);
		}
	}
}
