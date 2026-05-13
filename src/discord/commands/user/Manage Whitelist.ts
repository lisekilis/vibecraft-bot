import {
	APIModalInteractionResponseCallbackComponent,
	ApplicationCommandType,
	ApplicationIntegrationType,
	ComponentType,
	InteractionContextType,
} from 'discord-api-types/v10';
import { command } from '.';
import { messageResponse } from '../../util/responses';
import { ComponentID } from '../../util/components';
import { getUser, hasPrivilegedAccess } from '../../../helpers/user';
import { getGuildConfig } from '../../../helpers/config';

export default command({
	type: ApplicationCommandType.User,
	data: {
		type: ApplicationCommandType.User,
		name: 'Manage Whitelist',
		description: '',
		integration_types: [ApplicationIntegrationType.UserInstall],
		contexts: [InteractionContextType.Guild],
	},
	execute: async (interaction, env) => {
		const discordUser = interaction.member?.user || interaction.user!;
		const user = getUser(env, discordUser.id);
		const targetUser = getUser(env, interaction.data.target_id);
		const targetDiscordUser = interaction.data.resolved.users[interaction.data.target_id];

		const guild = getGuildConfig(env, interaction.guild_id!);

		if (!(await hasPrivilegedAccess(discordUser.id, guild))) return messageResponse('You do not have permission to use this command.');

		const whitelistModal: APIModalInteractionResponseCallbackComponent[] = [
			{
				type: ComponentType.Label,
				label: 'server',
				component: {
					type: ComponentType.StringSelect,
					custom_id: new ComponentID(ApplicationCommandType.User, 'Manage Whitelist').setComponent('server').toString(),
					options: [
						{
							label: 'Example server',
							value: 'example_server_id',
							description: 'This is an example server.',
						},
					],
				},
			},
		];

		return messageResponse('This command is not implemented yet.');
	},
});
