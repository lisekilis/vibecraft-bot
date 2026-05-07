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
import { invalidAutocompleteInteractionResponse, invalidInteractionResponse, messageResponse } from '../../util/responses';
import { ComponentID } from '../../util/components';

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

	// Handle autocomplete interactions for parent commands by routing them to the correct subcommand based on the interaction data
	let hasAutocomplete = false;

	if (command.subcommands) {
		for (const subcommand of command.subcommands) {
			if (subcommand.executeAutocomplete) {
				hasAutocomplete = true;
				break;
			}
		}
	}
	if (!hasAutocomplete && command.subcommandGroups) {
		for (const subcommandGroup of command.subcommandGroups) {
			for (const subcommand of subcommandGroup.subcommands) {
				if (subcommand.executeAutocomplete) {
					hasAutocomplete = true;
					break;
				}
			}
			if (hasAutocomplete) break;
		}
	}
	if (hasAutocomplete) {
		parentCommand.executeAutocomplete = async (interaction, env, ctx, reqUrl) => {
			if (interaction.data.options[0].type === ApplicationCommandOptionType.Subcommand) {
				const subcommandName = interaction.data.options[0].name;
				const subcommand = parentCommand.subcommands?.find((sc) => sc.data.name === subcommandName);
				if (subcommand && subcommand.executeAutocomplete) {
					return subcommand.executeAutocomplete(interaction, env, ctx, reqUrl);
				}
				return invalidAutocompleteInteractionResponse();
			}
			const subcommandGroupName = interaction.data.options[0].name;
			const subcommandGroup = parentCommand.subcommandGroups?.find((scg) => scg.data.name === subcommandGroupName);
			if (subcommandGroup) {
				const subcommandName = interaction.data.options[0].options[0].name;
				const subcommand = subcommandGroup.subcommands.find((sc) => sc.data.name === subcommandName);
				if (subcommand && subcommand.executeAutocomplete) {
					return subcommand.executeAutocomplete(interaction, env, ctx, reqUrl);
				}
				return invalidAutocompleteInteractionResponse();
			}
			return invalidAutocompleteInteractionResponse();
		};
	}

	// If the parent command has an executeComponent function, we need to route component interactions to the correct subcommand as well
	let hasComponentExecute = false;

	if (command.subcommands) {
		for (const subcommand of command.subcommands) {
			if (subcommand.executeComponent) {
				hasComponentExecute = true;
				break;
			}
		}
	}
	if (!hasComponentExecute && command.subcommandGroups) {
		for (const subcommandGroup of command.subcommandGroups) {
			for (const subcommand of subcommandGroup.subcommands) {
				if (subcommand.executeComponent) {
					hasComponentExecute = true;
					break;
				}
			}
			if (hasComponentExecute) break;
		}
	}
	if (hasComponentExecute) {
		parentCommand.executeComponent = async (interaction, env, ctx, reqUrl) => {
			if (!interaction.data.custom_id) {
				console.warn('Received component interaction without custom_id');
				return messageResponse('Invalid component interaction: missing custom_id', 1 << 6);
			}
			const componentId = new ComponentID(interaction.data.custom_id);
			if (componentId.commandType !== parentCommand.data.type || componentId.commandName !== parentCommand.data.name) {
				console.warn(
					'Received component interaction with mismatched command type or name',
					JSON.stringify({
						expectedType: parentCommand.data.type,
						expectedName: parentCommand.data.name,
						receivedType: componentId.commandType,
						receivedName: componentId.commandName,
					}),
				);
				return messageResponse('Component does not belong to this command', 1 << 6);
			}
			if (componentId.subcommandGroupName) {
				const subcommandGroup = parentCommand.subcommandGroups?.find((scg) => scg.data.name === componentId.subcommandGroupName);
				if (!subcommandGroup) {
					console.warn('Received component interaction with invalid subcommand group name', componentId.subcommandGroupName);
					return messageResponse('Invalid component interaction: subcommand group not found', 1 << 6);
				}
				const subcommand = subcommandGroup.subcommands.find((sc) => sc.data.name === componentId.subcommandName);
				if (!subcommand || !subcommand.executeComponent) {
					console.warn(
						'Received component interaction with invalid subcommand name or missing executeComponent',
						componentId.subcommandName,
					);
					return messageResponse('Invalid component interaction: subcommand not found or does not support components', 1 << 6);
				}
				return subcommand.executeComponent(interaction, env, ctx, reqUrl);
			}
			const subcommand = parentCommand.subcommands?.find((sc) => sc.data.name === componentId.subcommandName);
			if (subcommand && subcommand.executeComponent) {
				return subcommand.executeComponent(interaction, env, ctx, reqUrl);
			}
			console.warn(
				'Received component interaction with no matching subcommand for component',
				JSON.stringify({
					subcommandName: componentId.subcommandName,
					subcommands: parentCommand.subcommands?.map((sc) => sc.data.name),
				}),
			);
			return messageResponse('Invalid component interaction: no matching subcommand found for component', 1 << 6);
		};
	}
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
