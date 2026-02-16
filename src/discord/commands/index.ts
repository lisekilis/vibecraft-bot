import { APIInteraction, InteractionType } from 'discord-api-types/v10';

export default function (interaction: APIInteraction, env: Env, ctx: ExecutionContext) {
	const interactionType = interaction.type;
	switch (interactionType) {
		case InteractionType.Ping:
			return new Response(JSON.stringify({ type: 1 }), { status: 200 });
		case InteractionType.ApplicationCommand:
			// Handle application command interactions
			return new Response('Application Command Interaction received', { status: 200 });
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
