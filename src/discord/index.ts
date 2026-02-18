import { verifyKey } from 'discord-interactions';
import commands from './commands';

export default async function (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const publicKey = env.discordPublicKey.get();
	const signature = request.headers.get('X-Signature-Ed25519') || '';
	const timestamp = request.headers.get('X-Signature-Timestamp') || '';

	const body = await request.text();
	if (!verifyKey(body, signature, timestamp, await publicKey)) {
		return new Response('Invalid request signature', { status: 401 });
	}
	const reqUrl = new URL(request.url);
	return commands(JSON.parse(body), env, ctx, reqUrl);
}
