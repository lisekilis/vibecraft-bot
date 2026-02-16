import { MessageCommand, MessageCommandParameters } from '../../../types';

export function command(command: MessageCommandParameters): MessageCommand {
	return {
		...command,
	} as MessageCommand;
}
