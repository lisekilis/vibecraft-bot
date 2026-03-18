import { isChatInputApplicationCommandInteraction } from 'discord-api-types/utils';
import {
	APIApplicationCommandInteraction,
	ApplicationCommandType,
	APIUserApplicationCommandInteraction,
	APIMessageApplicationCommandInteraction,
	APIPrimaryEntryPointCommandInteraction,
	APIMessageComponentInteraction,
	APIApplicationCommandAutocompleteInteraction,
	APIChatInputApplicationCommandInteraction,
	MessageFlags,
	InteractionType,
} from 'discord-api-types/v10';
import { ChatInputCommand, UserCommand, MessageCommand, ActivityCommand, Command } from '../../types';
import { registry } from '../commands/registry';
import { messageResponse, pongResponse, promisedResponse } from './responses';

export function handlePingInteraction(): Promise<Response> {
	return promisedResponse(pongResponse());
}

export function handleCommandInteraction(
	interaction: APIApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	if (isChatInputApplicationCommandInteraction(interaction))
		return executeCommand(getCommand(interaction.data.name, interaction.data.type), interaction, env, ctx, reqUrl);

	if (interaction.data.type === ApplicationCommandType.User)
		return executeCommand(
			getCommand(interaction.data.name, interaction.data.type),
			interaction as APIUserApplicationCommandInteraction,
			env,
			ctx,
			reqUrl,
		);

	if (interaction.data.type === ApplicationCommandType.Message)
		return executeCommand(
			getCommand(interaction.data.name, interaction.data.type),
			interaction as APIMessageApplicationCommandInteraction,
			env,
			ctx,
			reqUrl,
		);

	if (interaction.data.type === ApplicationCommandType.PrimaryEntryPoint)
		return executeCommand(
			getCommand(interaction.data.name, interaction.data.type),
			interaction as APIPrimaryEntryPointCommandInteraction,
			env,
			ctx,
			reqUrl,
		);

	return promisedResponse(messageResponse('Unknown command type', MessageFlags.Ephemeral));
}

export function handleComponentInteraction(
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	const interactionType = interaction.message.interaction_metadata?.type;
	interaction.message.interaction?.name;
	if (interaction.message.interaction_metadata?.type == InteractionType.ApplicationCommand) {
	}
	const [commandType, commandName] = interaction.data.custom_id.split(':');
	// first character of custom_id is the command type, followed by a colon and then the command name
	const commandTypeEnum = parseInt(commandType) as ApplicationCommandType;

	if (commandTypeEnum == ApplicationCommandType.ChatInput) {
		return executeComponent(getCommand(commandName, commandTypeEnum), interaction, env, ctx, reqUrl);
	}
	if (commandTypeEnum == ApplicationCommandType.User) {
		return executeComponent(getCommand(commandName, commandTypeEnum), interaction, env, ctx, reqUrl);
	}
	if (commandTypeEnum == ApplicationCommandType.Message) {
		return executeComponent(getCommand(commandName, commandTypeEnum), interaction, env, ctx, reqUrl);
	}
	if (commandTypeEnum == ApplicationCommandType.PrimaryEntryPoint) {
		return executeComponent(getCommand(commandName, commandTypeEnum), interaction, env, ctx, reqUrl);
	}

	return promisedResponse(messageResponse('Unknown command type for component interaction', MessageFlags.Ephemeral));
}

export function handleAutocompleteInteraction(interaction: APIApplicationCommandAutocompleteInteraction): Promise<Response> {
	// Handle autocomplete interactions here
	return promisedResponse(messageResponse('Autocomplete Interaction received', MessageFlags.Ephemeral));
}

function getCommand(commandName: string, commandType: ApplicationCommandType.ChatInput): ChatInputCommand;
function getCommand(commandName: string, commandType: ApplicationCommandType.User): UserCommand;
function getCommand(commandName: string, commandType: ApplicationCommandType.Message): MessageCommand;
function getCommand(commandName: string, commandType: ApplicationCommandType.PrimaryEntryPoint): ActivityCommand;
function getCommand(commandName: string, commandType: ApplicationCommandType): Command {
	return registry[stringifyCommandType(commandType)]?.[commandName];
}

export async function executeCommand(
	command: ChatInputCommand,
	interaction: APIChatInputApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeCommand(
	command: UserCommand,
	interaction: APIUserApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeCommand(
	command: MessageCommand,
	interaction: APIMessageApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeCommand(
	command: ActivityCommand,
	interaction: APIPrimaryEntryPointCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeCommand(
	command: Command,
	interaction: APIApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	if (!command || typeof command.execute !== 'function') {
		return new Response('Command not found or invalid command module', { status: 404 });
	}
	if (command.type != interaction.data.type) {
		return new Response('Invalid command type for execution', { status: 400 });
	}
	const InteractionResponse = await command.execute(interaction as any, env, ctx, reqUrl);
	if (!InteractionResponse) {
		return new Response('Command executed but no response was returned', { status: 204 });
	}
	const response = new Response(JSON.stringify(InteractionResponse), { status: 200 });
	return response;
}
export async function executeComponent(
	command: ChatInputCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeComponent(
	command: UserCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeComponent(
	command: MessageCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeComponent(
	command: ActivityCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
export async function executeComponent(
	command: Command,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	if (!command || !command.executeComponent || typeof command.executeComponent !== 'function') {
		return new Response('Command not found or invalid command module', { status: 404 });
	}
	const InteractionResponse = await command.executeComponent(interaction, env, ctx, reqUrl);
	if (!InteractionResponse) {
		return new Response('Command executed but no response was returned', { status: 204 });
	}
	const response = new Response(JSON.stringify(InteractionResponse), { status: 200 });
	return response;
}

export function stringifyCommandType(type: ApplicationCommandType): 'chatInput' | 'user' | 'message' | 'activity' {
	switch (type) {
		case ApplicationCommandType.ChatInput:
			return 'chatInput';
		case ApplicationCommandType.User:
			return 'user';
		case ApplicationCommandType.Message:
			return 'message';
		case ApplicationCommandType.PrimaryEntryPoint:
			return 'activity';
	}
}
