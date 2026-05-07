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
	InteractionResponseType,
	ApplicationCommandOptionType,
	APIModalSubmitInteraction,
} from 'discord-api-types/v10';
import { ChatInputCommand, UserCommand, MessageCommand, ActivityCommand, Command } from '../../types';
import { registry } from '../commands/registry';
import { invalidAutocompleteInteractionResponse, messageResponse, pongResponse, promisedResponse } from './responses';
import { ComponentID } from './components';

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
	const componentID = new ComponentID(interaction.data.custom_id);
	const commandType = componentID.commandType;
	const commandName = componentID.commandName;

	if (commandType == ApplicationCommandType.ChatInput) {
		return executeComponent(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);
	}
	if (commandType == ApplicationCommandType.User) {
		return executeComponent(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);
	}
	if (commandType == ApplicationCommandType.Message) {
		return executeComponent(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);
	}
	if (commandType == ApplicationCommandType.PrimaryEntryPoint) {
		return executeComponent(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);
	}

	return promisedResponse(messageResponse('Unknown command type for component interaction', MessageFlags.Ephemeral));
}

export async function handleAutocompleteInteraction(
	interaction: APIApplicationCommandAutocompleteInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	// Handle autocomplete interactions here
	console.log('Received autocomplete interaction:', JSON.stringify(interaction));
	const command = getCommand(interaction.data.name, interaction.data.type);
	if (command) console.log('Found command for autocomplete interaction:', command.data.name);
	if (command && command.executeAutocomplete) {
		console.log('Found autocomplete handler for command:', interaction.data.name);
		return promisedResponse(await command.executeAutocomplete(interaction, env, ctx, reqUrl));
	}
	console.warn('No autocomplete handler found for command:', interaction.data.name);
	return promisedResponse(invalidAutocompleteInteractionResponse());
}

export async function handleModalSubmitInteraction(
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	const componentId = new ComponentID(interaction.data.custom_id);
	const commandType = componentId.commandType;
	const commandName = componentId.commandName;

	if (commandType == ApplicationCommandType.ChatInput)
		executeModalSubmit(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);

	if (commandType == ApplicationCommandType.User) executeModalSubmit(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);

	if (commandType == ApplicationCommandType.Message)
		executeModalSubmit(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);

	if (commandType == ApplicationCommandType.PrimaryEntryPoint)
		executeModalSubmit(getCommand(commandName, commandType), interaction, env, ctx, reqUrl);

	return promisedResponse(messageResponse('Unknown command type for modal submit interaction', MessageFlags.Ephemeral));
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
	const response = promisedResponse(InteractionResponse);
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
	const response = promisedResponse(InteractionResponse);
	return response;
}
async function executeModalSubmit(
	command: ChatInputCommand,
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeModalSubmit(
	command: UserCommand,
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeModalSubmit(
	command: MessageCommand,
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeModalSubmit(
	command: ActivityCommand,
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeModalSubmit(
	command: Command,
	interaction: APIModalSubmitInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	if (!command || !command.executeModalSubmit || typeof command.executeModalSubmit !== 'function') {
		return new Response('Command not found or invalid command module', { status: 404 });
	}
	const InteractionResponse = await command.executeModalSubmit(interaction, env, ctx, reqUrl);
	if (!InteractionResponse) {
		return new Response('Command executed but no response was returned', { status: 204 });
	}
	const response = promisedResponse(InteractionResponse);
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
