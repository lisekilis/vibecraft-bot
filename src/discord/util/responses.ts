import {
	APIApplicationCommandAutocompleteResponse,
	APIApplicationCommandOptionChoice,
	APIInteractionResponse,
	APIInteractionResponseChannelMessageWithSource,
	APIInteractionResponsePong,
	InteractionResponseType,
	MessageFlags,
	RouteBases,
	Routes,
} from 'discord-api-types/v10';

export function requestResponse(interactionId: string, interactionToken: string, response: APIInteractionResponse): Promise<Response> {
	return fetch(RouteBases.api + Routes.interactionCallback(interactionId, interactionToken), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(response),
	});
}

export function promisedResponse(content: APIInteractionResponse): Promise<Response> {
	return Promise.resolve(new Response(JSON.stringify(content), { headers: { 'Content-Type': 'application/json' }, status: 200 }));
}

export function pongResponse(): APIInteractionResponsePong {
	return {
		type: InteractionResponseType.Pong,
	};
}

export function autocompleteResponse(choices?: APIApplicationCommandOptionChoice[]): APIApplicationCommandAutocompleteResponse {
	return {
		type: InteractionResponseType.ApplicationCommandAutocompleteResult,
		data: {
			choices,
		},
	};
}

export function ephemeralResponse(content: string): APIInteractionResponseChannelMessageWithSource {
	return messageResponse(content, MessageFlags.Ephemeral);
}

export function messageResponse(content: string, flags?: MessageFlags): APIInteractionResponseChannelMessageWithSource {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content,
			allowed_mentions: { parse: [] },
			flags,
		},
	};
}

export function fuckoffResponse(): APIInteractionResponseChannelMessageWithSource {
	return {
		type: InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'fuck off',
		},
	};
}

export function invalidInteractionResponse(): APIInteractionResponseChannelMessageWithSource {
	return messageResponse('Invalid interaction');
}

export function invalidAutocompleteInteractionResponse(): APIApplicationCommandAutocompleteResponse {
	return { type: InteractionResponseType.ApplicationCommandAutocompleteResult, data: { choices: [] } };
}
