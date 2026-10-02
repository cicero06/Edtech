/**
 * Client for the Atlas backend (/v2) and Supabase Auth.
 * The public blog reads never need auth; the writer console signs in with
 * Supabase email+password and calls the guarded /v2/blog endpoints.
 */
import type { Post, PostBlock } from "./content";

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000";

const SUPABASE_URL: string | undefined = import.meta.env
  .VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY: string | undefined = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string | undefined;

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

// ---------- writer auth (Supabase REST — no supabase-js needed) ----------

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

async function supabaseToken(
  grant: Record<string, string>,
): Promise<WriterSession> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new ApiError(0, "Supabase yapılandırması eksik");
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(grant),
  });
  if (!res.ok) throw new ApiError(res.status, "Giriş başarısız");
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: { email?: string };
  };
  const session: WriterSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    email: data.user.email ?? "",
  };
  saveSession(session);
  return session;
}

export function signInWriter(email: string, password: string) {
  return supabaseToken({ grant_type: "password", email, password });
}

/** Valid session, transparently refreshed once when expired. */
export async function ensureWriterSession(): Promise<WriterSession | null> {
  const current = getWriterSession();
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    const stored = raw ? (JSON.parse(raw) as WriterSession) : null;
    if (!stored?.refreshToken) return null;
    return await supabaseToken({
      grant_type: "refresh_token",
      refresh_token: stored.refreshToken,
    });
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
