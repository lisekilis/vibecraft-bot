/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { linkHandler } from './accounts';
import interactionHandler from './discord';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		const pathParts = path.slice(1).split('/');

		if (pathParts[0] === 'interactions' && method === 'POST') return interactionHandler(request, env, ctx);
		if (pathParts[0] === 'link' && method === 'GET') return linkHandler(request, env);

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
