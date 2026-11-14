import { isAllowedOrigin } from './configure-app.js';

describe('isAllowedOrigin', () => {
  const explicit = ['https://preview.example.com'];

  it.each([
    'https://atlaslearningtech.com',
    'https://www.atlaslearningtech.com',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'https://preview.example.com',
  ])('allows %s', (origin) => {
    expect(isAllowedOrigin(origin, explicit)).toBe(true);
  });

  it.each([
    'https://evilatlaslearningtech.com',
    'https://atlaslearningtech.com.evil.io',
    'http://atlaslearningtech.com',
    'http://localhost.evil.com',
    'https://evil.com/localhost',
    'not a url',
  ])('rejects %s', (origin) => {
    expect(isAllowedOrigin(origin, explicit)).toBe(false);
  });
});
