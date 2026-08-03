import {
	APIModalInteractionResponseCallbackData,
	ComponentType,
	ApplicationCommandType,
	SelectMenuDefaultValueType,
	APILabelComponent,
	APIUserSelectComponent,
	APIStringSelectComponent,
	APIModalSubmitInteraction,
	CannotSendMessagesToThisUserErrorCodes,
} from 'discord-api-types/v10';
import { MinecraftServerData, UserData } from '../../types';
import { command } from '../commands/chatInput';
import { ComponentID } from './components';
import { getUser } from '../../helpers/user';
import { getMinecraftServer } from '../../helpers/server';

export class WhitelistModal {
	userSelectComponent: APILabelComponent & { component: APIUserSelectComponent } = {
		type: ComponentType.Label,
		label: 'Who would you like to perform whitelist management on?',
		component: {
			type: ComponentType.UserSelect,
			custom_id: 'userSelectComponent',
			default_values: undefined,
			disabled: this.user ? true : false,
		},
	};
	serverSelectComponent: APILabelComponent & { component: APIStringSelectComponent } = {
		type: ComponentType.Label,
		label: 'server',
		component: {
			type: ComponentType.StringSelect,
			custom_id: 'serverSelectComponent',
			options: [
				{
					label: '',
					value: '',
				},
			],
			disabled: this.user ? false : true,
		},
	};
	private user?: UserData;
	private servers?: MinecraftServerData[];

	modalData: APIModalInteractionResponseCallbackData = {
		title: 'User Whitelist Management',
		components: [this.userSelectComponent, this.serverSelectComponent],
		custom_id: '',
	};

	private refreshComponents() {
		this.modalData.components = [this.userSelectComponent, this.serverSelectComponent];
	}

	setServers(servers: MinecraftServerData[]) {
		this.servers = servers;
		this.serverSelectComponent.component.options = servers.map((server) => ({
			label: server.name,
			value: server.id,
			default: this.user ? server.whitelist.includes(this.user.id) : false,
		}));
		this.serverSelectComponent.component.disabled = this.user ? false : true;
		this.refreshComponents();
	}

	setUser(user: UserData) {
		this.user = user;
		this.userSelectComponent.component.default_values = [
			{
				id: user.id,
				type: SelectMenuDefaultValueType.User,
			},
		];
		this.userSelectComponent.component.disabled = true;
		if (this.servers) this.setServers(this.servers);
		this.refreshComponents();
	}

	constructor(modalCustomId: string, servers: MinecraftServerData[], user?: UserData) {
		this.modalData.custom_id = modalCustomId;
		this.setServers(servers);
		if (user) this.setUser(user);
	}
}

export function parseWhitelistModalSubmit(interaction: APIModalSubmitInteraction) {
	const labels = interaction.data.components.filter((component) => component.type == ComponentType.Label);
	const userSelectComponent = labels.find((component) => component.component.custom_id == 'userSelectComponent')?.component;
	const serverSelectComponent = labels.find((component) => component.component.custom_id == 'serverSelectComponent')?.component;

	if (!userSelectComponent || userSelectComponent?.type != ComponentType.UserSelect) {
		console.warn('Tried parsing Whitelist Modal, but found no User Select Component');
		return { userId: undefined, servers: undefined };
	}

	if (!serverSelectComponent || serverSelectComponent?.type != ComponentType.StringSelect) {
		console.warn('Tried parsing Whitelist Modal, but found no Server Select Component');
		return { userId: undefined, servers: undefined };
	}

	const userId = userSelectComponent.values[0];
	const servers = serverSelectComponent.values;

	return {
		userId,
		servers,
	};
}

export async function addToWhitelist(env: Env, userId: string, serverId: string) {
	const user = await getUser(env, userId);
	const server = await getMinecraftServer(env, userId);
	if (!user || !server) return undefined;
}
export async function removeWhitelist() {}
