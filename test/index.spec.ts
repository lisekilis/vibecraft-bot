import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

vi.mock(import('discord-interactions'), () => {
	return {
		verifyKey(
			rawBody: string | ArrayBuffer | Uint8Array<ArrayBufferLike> | Buffer<ArrayBufferLike>,
			signature: string,
			timestamp: string,
			clientPublicKey: string | CryptoKey,
		): Promise<boolean> {
			if (rawBody && signature === 'valid' && timestamp === 'valid') return Promise.resolve(true);

			return Promise.resolve(false);
		},
	};
});

describe('Discord Interactions', () => {
	it('responds to Ping with Pong!', async () => {
		const request = new IncomingRequest('http://example.com/interactions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Signature-Ed25519': 'valid',
				'X-Signature-Timestamp': 'valid',
			},
			body: JSON.stringify({
				type: InteractionType.Ping,
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toMatchObject({
			type: InteractionResponseType.Pong,
		});
	});
});

describe('Hello World worker', () => {
	it('responds with Hello World! (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});
});
