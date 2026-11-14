import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

/** One Nest app per warm serverless instance. */
let cached: Promise<Handler> | null = null;

async function create(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance() as Handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  cached ??= create().catch((err) => {
    cached = null;
    throw err;
  });
  const app = await cached;
  app(req, res);
}
