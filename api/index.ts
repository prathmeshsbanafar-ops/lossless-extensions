import type { IncomingMessage, ServerResponse } from 'node:http';
import { handler } from '../src/server.js';

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handler(req, res);
}
