/**
 * Adult sign-in for the gate — Firebase Auth (HarmonyTown project) over its
 * public REST API (no firebase SDK dependency, same pattern as the site's
 * writer console).
 *
 * The ID token lands on the Atlas backend as `Authorization: Bearer <jwt>`
 * and resolves to an `adult` principal (OWNER / FACILITATOR / VIEWER per
 * workspace). Students never come through here — they join with a group
 * code + roster name via /v2/join.
 *
 * Env: VITE_FIREBASE_API_KEY (public web key, defaults to HarmonyTown's).
 */

const API_KEY: string =
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ??
  'AIzaSyAIzNS71RsoRsbfFqcrJ1uWe7qzDs4gHOs';

const IDENTITY = 'https://identitytoolkit.googleapis.com/v1/accounts';
const SECURE_TOKEN = 'https://securetoken.googleapis.com/v1/token';

export function isAdultAuthConfigured(): boolean {
  return Boolean(API_KEY);
}

export interface AdultSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

const SESSION_KEY = 'denge:v2:adult';

export function getAdultSession(): AdultSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdultSession;
    return s.expiresAt > Date.now() + 10_000 ? s : null;
  } catch {
    return null;
  }
}

function saveSession(s: AdultSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function signOutAdult(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export class AdultAuthError extends Error {}

const ERRORS: Record<string, string> = {
  EMAIL_EXISTS: 'Bu e-posta ile zaten bir hesap var.',
  EMAIL_NOT_FOUND: 'E-posta veya parola hatalı.',
  INVALID_PASSWORD: 'E-posta veya parola hatalı.',
  INVALID_LOGIN_CREDENTIALS: 'E-posta veya parola hatalı.',
  INVALID_EMAIL: 'Geçerli bir e-posta adresi girin.',
  USER_DISABLED: 'Bu hesap devre dışı bırakılmış.',
  TOO_MANY_ATTEMPTS_TRY_LATER:
    'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
  WEAK_PASSWORD: 'Parola en az 6 karakter olmalı.',
  OPERATION_NOT_ALLOWED: 'E-posta ile giriş bu projede kapalı.',
};

async function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const code = (detail?.error?.message ?? '').split(' ')[0].split(':')[0];
    throw new AdultAuthError(ERRORS[code] ?? fallback);
  }
  return (await res.json()) as T;
}

interface IdentityResult {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  email?: string;
}

function toSession(r: IdentityResult, email: string): AdultSession {
  const session: AdultSession = {
    accessToken: r.idToken,
    refreshToken: r.refreshToken,
    expiresAt: Date.now() + Number(r.expiresIn || 3600) * 1000,
    email: r.email ?? email,
  };
  saveSession(session);
  return session;
}

export async function signInAdult(email: string, password: string) {
  const r = await post<IdentityResult>(
    `${IDENTITY}:signInWithPassword?key=${API_KEY}`,
    { email, password, returnSecureToken: true },
    'Giriş başarısız',
  );
  return toSession(r, email);
}

export async function signUpAdult(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ session: AdultSession | null; requiresEmailConfirmation: boolean }> {
  let r = await post<IdentityResult>(
    `${IDENTITY}:signUp?key=${API_KEY}`,
    { email, password, returnSecureToken: true },
    'Kayıt başarısız',
  );
  if (fullName?.trim()) {
    // Fresh token so the backend sees the display name (`name` claim).
    r = await post<IdentityResult>(
      `${IDENTITY}:update?key=${API_KEY}`,
      { idToken: r.idToken, displayName: fullName.trim(), returnSecureToken: true },
      'Kayıt başarısız',
    ).catch(() => r);
  }
  return { session: toSession(r, email), requiresEmailConfirmation: false };
}

/** Valid session, transparently refreshed once when expired. */
export async function ensureAdultSession(): Promise<AdultSession | null> {
  const current = getAdultSession();
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const stored = raw ? (JSON.parse(raw) as AdultSession) : null;
    if (!stored?.refreshToken) return null;
    const res = await fetch(`${SECURE_TOKEN}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
      }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = (await res.json()) as {
      id_token: string;
      refresh_token: string;
      expires_in: string;
    };
    return toSession(
      {
        idToken: data.id_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      },
      stored.email,
    );
  } catch {
    signOutAdult();
    return null;
  }
}
