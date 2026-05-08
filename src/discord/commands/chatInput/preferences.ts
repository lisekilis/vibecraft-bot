import { ComponentType, ApplicationCommandType } from 'discord-api-types/v10';
import { ComponentID } from '../../util/components';

// {
// 						type: ComponentType.Label,
// 						label: 'Default Account',
// 						description: 'Select your default account to show on your profile',
// 						component: {
// 							type: ComponentType.StringSelect,
// 							custom_id: new ComponentID(ApplicationCommandType.ChatInput, 'account')
// 								.setSubcommand('preferences')
// 								.setComponent('default')
// 								.toString(),
// 							options: user.xboxAccounts.map((acc) => ({
// 								label: acc.gamertag,
// 								value: acc.xboxUserId,
// 								default: acc.xboxUserId === user.defaultXboxAccountId,
// 								description: acc.minecraftAccount ? `Minecraft username: ${acc.minecraftAccount.name}` : undefined,
// 							})),
// 						},
// 					},
