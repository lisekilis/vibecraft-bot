import { verifyKey } from 'discord-interactions';

export default async function (request: Request, env: Env): Promise<Response> {
	const publicKey = env.discordPublicKey.get();
	const signature = request.headers.get('X-Signature-Ed25519') || '';
	const timestamp = request.headers.get('X-Signature-Timestamp') || '';

	const body = await request.text();
	if (!verifyKey(body, signature, timestamp, await publicKey)) {
		return new Response('Invalid request signature', { status: 401 });
	}
	return new Response('Hello from Discord interaction endpoint!');
}
