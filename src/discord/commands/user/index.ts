import { UserCommand, UserCommandParameters } from '../../../types';

export function command(command: UserCommandParameters): UserCommand {
	return {
		...command,
	} as UserCommand;
}
