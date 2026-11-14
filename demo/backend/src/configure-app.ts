import { ValidationPipe, type INestApplication } from '@nestjs/common';

/**
 * Shared app setup for the long-running server (main.ts) and the Vercel
 * serverless entry (serverless.ts).
 */
const SITE_HOSTS = ['atlaslearningtech.com', 'www.atlaslearningtech.com'];

export function isAllowedOrigin(origin: string, explicit: string[]): boolean {
  const clean = origin.replace(/\/$/, '');
  if (explicit.includes(clean)) return true;
  let url: URL;
  try {
    url = new URL(clean);
  } catch {
    return false;
  }
  const host = url.hostname;
  if (url.protocol === 'https:' && SITE_HOSTS.includes(host)) return true;
  // Local development only (exact hosts, any port).
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return false;
}

export function configureApp(app: INestApplication) {
  const explicit = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      return callback(null, isAllowedOrigin(origin, explicit));
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
