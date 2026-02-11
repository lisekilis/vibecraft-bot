import { APIInteractionGuildMember, PermissionFlagsBits } from 'discord-api-types/v10';

export function verifyAdmin(user: APIInteractionGuildMember): boolean {
	if (user.permissions === undefined) {
		return false;
	}
	return (user.permissions && PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator; // Check if the member has the ADMINISTRATOR permission
}

export function verifyRole(user: APIInteractionGuildMember, roleID: string): boolean {
	if (user.roles === undefined) {
		return false;
	}
	return user.roles.includes(roleID); // Check if the member has the specified role
}
