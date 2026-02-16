import { ActivityCommand, ActivityCommandParameters } from '../../../types';

export function command(command: ActivityCommandParameters): ActivityCommand {
	return {
		...command,
	} as ActivityCommand;
}
