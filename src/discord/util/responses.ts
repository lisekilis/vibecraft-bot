import { APIInteractionResponseChannelMessageWithSource, InteractionResponseType, MessageFlags } from 'discord-api-types/v10';

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
