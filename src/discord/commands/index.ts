import { APIInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import { handleCommandInteraction, handleComponentInteraction, handlePingInteraction } from '../util/handlers';
import { pongResponse } from '../util/responses';
import { json } from 'node:stream/consumers';

export default async function (interaction: APIInteraction, env: Env, ctx: ExecutionContext, reqUrl: URL): Promise<Response> {
	const interactionType = interaction.type;
	switch (interactionType) {
		case InteractionType.Ping:
			console.log('Received Ping Interaction, responding with Pong', JSON.stringify(pongResponse()));
			return handlePingInteraction();
		case InteractionType.ApplicationCommand:
			// Handle application command interactions
			return handleCommandInteraction(interaction, env, ctx, reqUrl);
		case InteractionType.MessageComponent:
			// Handle message component interactions
			return handleComponentInteraction(interaction, env, ctx, reqUrl);
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
