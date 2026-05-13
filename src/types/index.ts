export * from './command';

export interface GuildConfig {
	/** List of administrators stored as discord user IDs */
	admins?: string[];
	moderatorRoleID?: string;
}

export interface MinecraftServerData {
	/**The unique identifier of the Minecraft server*/
	id: string;
	/**The name of the Minecraft server*/
	name: string;
	/** Discord Ids of the administrators for the Minecraft server */
	admins: string[];
	/** Discord Ids of the users whitelisted for the Minecraft server */
	whitelist: string[];
	/**The IP address of the Minecraft server*/
	ip: string;
	/**The port number of the Minecraft server*/
	port: number;
}

export const defaultConfig: GuildConfig = {
	moderatorRoleID: undefined,
};

export interface UserData {
	id: string;
	xboxAccounts?: XboxUserData[];
	defaultXboxAccountId?: string;
	/** IDs of the servers the user is a member of */
	servers?: string[];
}

export const defaultUserData: UserData = {
	id: '',
	xboxAccounts: [],
	defaultXboxAccountId: undefined,
	servers: [],
};

export interface XboxUserData {
	xboxUserId: string;
	gameDisplayName: string;
	appDisplayName: string;
	gamertag: string;
	gameProfilePicture: string;
	minecraftAccount?: MinecraftUserData;
	preferences: XboxAccountPreferences;
}

export interface XboxAccountPreferences {
	/**The pose to use for rendering the Minecraft skin in the profile embed. */
	skinRenderPose: SkinRenderPose;
}

export enum SkinRenderPose {
	Default = 'default',
	Marching = 'marching',
	Walking = 'walking',
	Crouching = 'crouching',
	Crossed = 'crossed',
	CrissCross = 'criss_cross',
	Ultimate = 'ultimate',
	Isometric = 'isometric',
	Cheering = 'cheering',
	Relaxing = 'relaxing',
	Trudging = 'trudging',
	Cowering = 'cowering',
	Pointing = 'pointing',
	Lunging = 'lunging',
	Dungeons = 'dungeons',
	Facepalm = 'facepalm',
	Sleeping = 'sleeping',
	Dead = 'dead',
	Archer = 'archer',
	Kicking = 'kicking',
	Mojavatar = 'mojavatar',
	Reading = 'reading',
	HighGround = 'high_ground',
	Clown = 'clown',
	Bitzel = 'bitzel',
	Pixel = 'pixel',
	Profile = 'profile',
}

export interface MinecraftUserData {
	/**The unique identifier of the Minecraft account*/
	id: string;
	/**The username of the Minecraft account*/
	name: string;
	/**An array of skins associated with the Minecraft account*/
	skins: MinecraftSkinData[];
	/**An array of capes associated with the Minecraft account*/
	capes: MinecraftCapeData[];
}

export interface MinecraftSkinData {
	/**The unique identifier of the skin*/
	id: string;
	/**The state of the skin, e.g., ACTIVE or INACTIVE*/
	state: string;
	/**The URL of the skin texture*/
	url: string;
	/**The variant of the skin, e.g., CLASSIC or SLIM*/
	variant: string;
	/**The alias of the skin, e.g., STEVE or ALEX*/
	alias: string;
}

export interface MinecraftCapeData {
	/**The unique identifier of the cape*/
	id: string;
	/**The state of the cape, e.g., ACTIVE or INACTIVE*/
	state: string;
	/**The URL of the cape texture*/
	url: string;
	/**The alias of the cape, e.g., Migrator*/
	alias: string;
}
