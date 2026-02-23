import {
	APIApplicationCommandInteraction,
	APIChatInputApplicationCommandDMInteraction,
	APIChatInputApplicationCommandInteraction,
	APIInteraction,
	APIMessageApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIPrimaryEntryPointCommandInteraction,
	APIUserApplicationCommandInteraction,
	ApplicationCommandType,
	InteractionType,
} from 'discord-api-types/v10';
import { InteractionResponseType } from 'discord-interactions';
import { ActivityCommand, ChatInputCommand, Command, MessageCommand, UserCommand } from '../../types';
import { isChatInputApplicationCommandInteraction } from 'discord-api-types/utils';
import { registry } from './registry';

export default async function (interaction: APIInteraction, env: Env, ctx: ExecutionContext, reqUrl: URL): Promise<Response> {
	const interactionType = interaction.type;
	switch (interactionType) {
		case InteractionType.Ping:
			return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), { status: 200 });
		case InteractionType.ApplicationCommand:
			// Handle application command interactions
			return handleCommandInteraction(interaction, env, ctx, reqUrl);
		case InteractionType.MessageComponent:
			// Handle message component interactions
			return new Response('Message Component Interaction received', { status: 200 });
		case InteractionType.ApplicationCommandAutocomplete:
			// Handle autocomplete interactions
			return new Response('Autocomplete Interaction received', { status: 200 });
		case InteractionType.ModalSubmit:
			// Handle modal submit interactions
			return new Response('Modal Submit Interaction received', { status: 200 });
		default:
			return new Response('Unknown interaction type', { status: 400 });
	}
}

function handleCommandInteraction(
	interaction: APIApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response> {
	if (isChatInputApplicationCommandInteraction(interaction))
		return executeCommand(getCommand(interaction.data.name, 'chatInput'), interaction, env, ctx, reqUrl);

	if (interaction.data.type === ApplicationCommandType.User)
		return executeCommand(getCommand(interaction.data.name, 'user'), interaction as APIUserApplicationCommandInteraction, env, ctx, reqUrl);

	if (interaction.data.type === ApplicationCommandType.Message)
		return executeCommand(
			getCommand(interaction.data.name, 'message'),
			interaction as APIMessageApplicationCommandInteraction,
			env,
			ctx,
			reqUrl,
		);

	if (interaction.data.type === ApplicationCommandType.PrimaryEntryPoint)
		return executeCommand(
			getCommand(interaction.data.name, 'activity'),
			interaction as APIPrimaryEntryPointCommandInteraction,
			env,
			ctx,
			reqUrl,
		);

	return Promise.resolve(new Response('Unknown command type', { status: 400 }));
}

function getCommand(commandName: string, commandType: 'chatInput'): ChatInputCommand;
function getCommand(commandName: string, commandType: 'user'): UserCommand;
function getCommand(commandName: string, commandType: 'message'): MessageCommand;
function getCommand(commandName: string, commandType: 'activity'): ActivityCommand;
function getCommand(commandName: string, commandType: 'activity' | 'chatInput' | 'message' | 'user'): Command {
	return registry[commandType]?.[commandName];
}

async function executeCommand(
	command: ChatInputCommand,
	interaction: APIChatInputApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeCommand(
	command: UserCommand,
	interaction: APIUserApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeCommand(
	command: MessageCommand,
	interaction: APIMessageApplicationCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeCommand(
	command: ActivityCommand,
	interaction: APIPrimaryEntryPointCommandInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeCommand(
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
async function executeComponent(
	command: ChatInputCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeComponent(
	command: UserCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeComponent(
	command: MessageCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeComponent(
	command: ActivityCommand,
	interaction: APIMessageComponentInteraction,
	env: Env,
	ctx: ExecutionContext,
	reqUrl: URL,
): Promise<Response>;
async function executeComponent(
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
