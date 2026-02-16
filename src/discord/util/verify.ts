import { APIInteractionGuildMember, APIUser, PermissionFlagsBits } from 'discord-api-types/v10';

export function verifyUser(user: APIUser, userID: string): boolean {
	if (user.id === userID) {
		return true;
	}
	return false;
}

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
