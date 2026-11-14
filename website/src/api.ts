/**
 * Client for the Atlas backend (/v2) and Firebase Auth (HarmonyTown).
 * The public blog reads never need auth; the writer console signs in with
 * Firebase email+password and calls the guarded /v2/blog endpoints.
 */
import type { Post, PostBlock } from "./content";

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000";

const FIREBASE_API_KEY: string =
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ??
  "AIzaSyAIzNS71RsoRsbfFqcrJ1uWe7qzDs4gHOs";

export type RemotePost = Post;
export type OwnedPost = RemotePost & {
  id: string;
  status: "DRAFT" | "PUBLISHED";
};

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApiError(response.status, body || response.statusText);
  }
  return (await response.json()) as T;
}

// ---------- public blog reads ----------

export function fetchPublishedPosts(): Promise<RemotePost[]> {
  return call<RemotePost[]>("/v2/blog/posts");
}

export function fetchPublishedPost(slug: string): Promise<RemotePost> {
  return call<RemotePost>(`/v2/blog/posts/${encodeURIComponent(slug)}`);
}

// ---------- writer auth (Firebase Auth REST — no firebase SDK needed) ----------

const TOKEN_KEY = "atlas:writer";

interface WriterSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export function getWriterSession(): WriterSession | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as WriterSession;
    return s.expiresAt > Date.now() + 10_000 ? s : null;
  } catch {
    return null;
  }
}

function saveSession(s: WriterSession) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(s));
}

export function signOutWriter() {
  sessionStorage.removeItem(TOKEN_KEY);
}

const AUTH_ERRORS: Record<string, string> = {
  EMAIL_NOT_FOUND: "E-posta veya parola hatalı",
  INVALID_PASSWORD: "E-posta veya parola hatalı",
  INVALID_LOGIN_CREDENTIALS: "E-posta veya parola hatalı",
  INVALID_EMAIL: "Geçerli bir e-posta adresi girin",
  USER_DISABLED: "Bu hesap devre dışı bırakılmış",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Çok fazla deneme — biraz sonra tekrar deneyin",
};

async function firebaseAuth(
  url: string,
  init: RequestInit,
): Promise<{ idToken: string; refreshToken: string; expiresIn: string; email?: string }> {
  const res = await fetch(url, { method: "POST", ...init });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const code = (detail?.error?.message ?? "").split(" ")[0].split(":")[0];
    throw new ApiError(res.status, AUTH_ERRORS[code] ?? "Giriş başarısız");
  }
  const data = (await res.json()) as Record<string, string>;
  return {
    idToken: data.idToken ?? data.id_token,
    refreshToken: data.refreshToken ?? data.refresh_token,
    expiresIn: data.expiresIn ?? data.expires_in,
    email: data.email,
  };
}

function storeSession(
  r: { idToken: string; refreshToken: string; expiresIn: string; email?: string },
  email: string,
): WriterSession {
  const session: WriterSession = {
    accessToken: r.idToken,
    refreshToken: r.refreshToken,
    expiresAt: Date.now() + Number(r.expiresIn || 3600) * 1000,
    email: r.email ?? email,
  };
  saveSession(session);
  return session;
}

export async function signInWriter(email: string, password: string) {
  const r = await firebaseAuth(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  return storeSession(r, email);
}

/** Valid session, transparently refreshed once when expired. */
export async function ensureWriterSession(): Promise<WriterSession | null> {
  const current = getWriterSession();
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    const stored = raw ? (JSON.parse(raw) as WriterSession) : null;
    if (!stored?.refreshToken) return null;
    const r = await firebaseAuth(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: stored.refreshToken,
        }),
      },
    );
    return storeSession(r, stored.email);
  } catch {
    signOutWriter();
    return null;
  }
}

// ---------- writer endpoints ----------

export function fetchMyPosts(token: string): Promise<OwnedPost[]> {
  return call<OwnedPost[]>("/v2/blog/mine", {}, token);
}

export interface DraftInput {
  title: string;
  tag: string;
  excerpt: string;
  displayDate?: string;
  slug?: string;
  body: PostBlock[];
  publish?: boolean;
}

export function createPost(token: string, input: DraftInput) {
  return call<OwnedPost>("/v2/blog/posts", {
    method: "POST",
    body: JSON.stringify(input),
  }, token);
}

export function updatePost(token: string, id: string, input: DraftInput) {
  return call<OwnedPost>(`/v2/blog/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, token);
}

export function publishPost(token: string, id: string) {
  return call<OwnedPost>(`/v2/blog/posts/${id}/publish`, {
    method: "POST",
  }, token);
}

// ---------- body text <-> PostBlock[] ----------

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u",
};

export function slugify(title: string): string {
  return title
    .toLocaleLowerCase("tr")
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Plain-text convention for writers:
 *   "## Başlık"  → heading block
 *   "- madde"    → list items (consecutive lines merge)
 *   other lines  → paragraphs (blank line = separator)
 */
export function textToBlocks(text: string): PostBlock[] {
  const blocks: PostBlock[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      blocks.push({ ul: list });
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ h: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2).trim());
    } else {
      flushList();
      blocks.push({ p: line });
    }
  }
  flushList();
  return blocks;
}

export function blocksToText(blocks: PostBlock[]): string {
  return blocks
    .map((b) =>
      "h" in b
        ? `## ${b.h}`
        : "ul" in b
          ? b.ul.map((i) => `- ${i}`).join("\n")
          : b.p,
    )
    .join("\n\n");
}
