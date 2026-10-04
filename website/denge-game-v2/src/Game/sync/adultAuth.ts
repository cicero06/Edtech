/**
 * Adult sign-in for the gate — Supabase Auth over plain REST (no supabase-js
 * dependency, same pattern as the site's writer console).
 *
 * The JWT lands on the Atlas backend as `Authorization: Bearer <jwt>` and
 * resolves to an `adult` principal (OWNER / FACILITATOR / VIEWER per
 * workspace). Students never come through here — they join with a group
 * code + roster name via /v2/join.
 *
 * Env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. When unset the adult path
 * is hidden and the dev-handle seam (x-atlas-user, non-production backend)
 * is the only staff entry.
 */

const SUPABASE_URL: string | undefined = import.meta.env
  .VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY: string | undefined = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string | undefined;

export function isAdultAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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

async function supabaseToken(
  grantType: string,
  grant: Record<string, string>,
): Promise<AdultSession> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new AdultAuthError('Supabase yapılandırması eksik');
  }
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=${grantType}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(grant),
    },
  );
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error_description?: string;
      msg?: string;
      error?: string;
    } | null;
    throw new AdultAuthError(
      detail?.error_description ?? detail?.msg ?? detail?.error ?? 'Giriş başarısız',
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { email?: string };
  };
  const session: AdultSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    email: data.user.email ?? '',
  };
  saveSession(session);
  return session;
}

export function signInAdult(email: string, password: string) {
  return supabaseToken('password', { email, password });
}

export async function signUpAdult(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ session: AdultSession | null; requiresEmailConfirmation: boolean }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new AdultAuthError('Supabase yapılandırması eksik');
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      data: fullName ? { full_name: fullName } : {},
    }),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error_description?: string;
      msg?: string;
      error?: string;
      message?: string;
    } | null;
    throw new AdultAuthError(
      detail?.error_description ??
        detail?.msg ??
        detail?.message ??
        detail?.error ??
        'Kayıt başarısız',
    );
  }
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { email?: string };
    session?: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  };

  const token = data.session?.access_token ?? data.access_token;
  const refreshToken = data.session?.refresh_token ?? data.refresh_token;
  const expiresIn = data.session?.expires_in ?? data.expires_in ?? 3600;

  if (token && refreshToken) {
    const session: AdultSession = {
      accessToken: token,
      refreshToken: refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      email: data.user?.email ?? email,
    };
    saveSession(session);
    return { session, requiresEmailConfirmation: false };
  }

  return { session: null, requiresEmailConfirmation: true };
}

/** Valid session, transparently refreshed once when expired. */
export async function ensureAdultSession(): Promise<AdultSession | null> {
  const current = getAdultSession();
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const stored = raw ? (JSON.parse(raw) as AdultSession) : null;
    if (!stored?.refreshToken) return null;
    return await supabaseToken('refresh_token', {
      refresh_token: stored.refreshToken,
    });
  } catch {
    signOutAdult();
    return null;
  }
}
