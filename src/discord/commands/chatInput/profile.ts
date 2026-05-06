import { ApplicationCommandType } from 'discord-api-types/v10';
import { command } from '.';

export default command({
	type: ApplicationCommandType.ChatInput,
	data: {
		name: 'profile',
		description: 'View your linked Minecraft accounts',
		type: ApplicationCommandType.ChatInput,
	},
});
