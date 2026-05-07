import { ApplicationCommandType } from 'discord-api-types/v10';

export class ComponentID {
	commandType: ApplicationCommandType;
	commandName: string;
	subcommandGroupName?: string;
	subcommandName?: string;
	componentName?: string;

	constructor(commandType: ApplicationCommandType, commandName: string);
	constructor(componentId: string);
	constructor(componentIdorType: ApplicationCommandType | string, commandName?: string) {
		if (typeof componentIdorType === 'string') {
			const [commandTypeAndName, subcommandGroupName, subcommandName, componentName] = componentIdorType.split(':');
			const commandType = commandTypeAndName.match(/^\d+/)?.[0];
			const commandName = commandTypeAndName.replace(/^\d+/, '');
			if (!commandType || !commandName) {
				throw new Error(`Invalid component ID format: ${componentIdorType}`);
			}
			this.commandType = parseInt(commandType) as ApplicationCommandType;
			this.commandName = commandName;
			if (subcommandGroupName) this.subcommandGroupName = subcommandGroupName;
			if (subcommandName) this.subcommandName = subcommandName;
			if (componentName) this.componentName = componentName;
		} else {
			this.commandType = componentIdorType;
			this.commandName = commandName!;
		}
	}

	setSubcommandGroup(subcommandGroupName: string) {
		this.subcommandGroupName = subcommandGroupName;
		return this;
	}

	setSubcommand(subcommandName: string) {
		this.subcommandName = subcommandName;
		return this;
	}

	setComponent(componentName: string) {
		this.componentName = componentName;
		return this;
	}

	toString() {
		return `${this.commandType}${this.commandName}:${this.subcommandGroupName ?? ''}:${this.subcommandName ?? ''}:${this.componentName ?? ''}`;
	}
}
