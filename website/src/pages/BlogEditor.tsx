import { useCallback, useEffect, useState } from "react";
import {
  blocksToText,
  createPost,
  ensureWriterSession,
  fetchMyPosts,
  publishPost,
  signInWriter,
  signOutWriter,
  slugify,
  textToBlocks,
  updatePost,
  type OwnedPost,
} from "../api";
import { Eyebrow } from "../components/Eyebrow";

/**
 * Hidden writer console at /yazar. Sign-in is Firebase email+password;
 * the backend additionally checks the email against BLOG_AUTHOR_EMAILS.
 * Body format: paragraphs separated by blank lines, "## " headings,
 * "- " list items.
 */
export function BlogEditor() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    void ensureWriterSession().then((s) => {
      setEmail(s?.email ?? null);
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  if (!email) {
    return (
      <section className="section container post">
        <Eyebrow>YAZAR GİRİŞİ</Eyebrow>
        <h1>Yazar paneli</h1>
        <form
          className="writer-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setSignInError(null);
            const data = new FormData(e.currentTarget);
            try {
              const s = await signInWriter(
                String(data.get("email")),
                String(data.get("password")),
              );
              setEmail(s.email);
            } catch (err) {
              setSignInError(
                `Giriş başarısız — ${
                  err instanceof Error ? err.message : "e-posta/şifreyi kontrol et."
                }`,
              );
            }
          }}
        >
          <input name="email" type="email" placeholder="E-posta" required />
          <input
            name="password"
            type="password"
            placeholder="Şifre"
            required
          />
          {signInError && <p className="form-error">{signInError}</p>}
          <button className="button primary" type="submit">
            Giriş yap
          </button>
        </form>
      </section>
    );
  }

  return (
    <WriterConsole
      email={email}
      onSignOut={() => {
        signOutWriter();
        setEmail(null);
      }}
    />
  );
}

function WriterConsole({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const [posts, setPosts] = useState<OwnedPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tag, setTag] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = useCallback(async () => {
    const s = await ensureWriterSession();
    if (!s) {
      onSignOut();
      throw new Error("Oturum düştü");
    }
    return s.accessToken;
  }, [onSignOut]);

  const refresh = useCallback(async () => {
    try {
      setPosts(await fetchMyPosts(await token()));
    } catch {
      /* token() already signed out if needed */
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setTag("");
    setDisplayDate("");
    setExcerpt("");
    setBody("");
  };

  const save = async (publish: boolean) => {
    setError(null);
    setNotice(null);
    const blocks = textToBlocks(body);
    if (!blocks.length) {
      setError("Gövde boş olamaz.");
      return;
    }
    setBusy(true);
    try {
      const t = await token();
      const input = {
        title,
        tag,
        excerpt,
        displayDate: displayDate || undefined,
        slug: slug || undefined,
        body: blocks,
        publish,
      };
      if (editingId) await updatePost(t, editingId, input);
      else await createPost(t, input);
      reset();
      await refresh();
      setNotice(
        publish
          ? "Yayınlandı — statik sayfa ~1-2 dk içinde canlıya işlenir."
          : "Taslak kaydedildi.",
      );
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("not an approved")
          ? "Bu e-posta yazar listesinde değil."
          : "Kayıt başarısız — alanları kontrol et.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section container post">
      <Eyebrow>YAZAR PANELİ · {email}</Eyebrow>
      <h1>Yazılar</h1>

      {posts.length > 0 && (
        <ul className="writer-list">
          {posts.map((p) => (
            <li key={p.id}>
              <span>
                {p.title} <em>· {p.status === "PUBLISHED" ? "yayında" : "taslak"}</em>
              </span>
              <button
                className="text-link"
                type="button"
                onClick={() => {
                  setEditingId(p.id);
                  setTitle(p.title);
                  setSlug(p.slug);
                  setSlugTouched(true);
                  setTag(p.tag);
                  setDisplayDate(p.date);
                  setExcerpt(p.excerpt);
                  setBody(blocksToText(p.body));
                }}
              >
                Düzenle
              </button>
              {p.status === "DRAFT" && (
                <button
                  className="text-link"
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await publishPost(await token(), p.id).catch(() => {});
                    await refresh();
                    setBusy(false);
                  }}
                >
                  Yayınla
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="writer-form">
        <h2>{editingId ? "Yazıyı düzenle" : "Yeni yazı"}</h2>
        <input
          placeholder="Başlık"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <input
          placeholder="slug (adres)"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <input
          placeholder="Etiket — ör. Geliştirme günlüğü"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <input
          placeholder="Tarih — boşsa bugünün ay/yılı (ör. Ekim 2026)"
          value={displayDate}
          onChange={(e) => setDisplayDate(e.target.value)}
        />
        <textarea
          placeholder="Özet — blog listesindeki 1-2 cümlelik tanıtım"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
        <textarea
          placeholder={
            "Gövde — boş satırla paragraf ayır.\n## ile ara başlık, - ile liste maddesi."
          }
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-ok">{notice}</p>}
        <div className="writer-actions">
          <button
            className="button primary"
            type="button"
            disabled={busy || !title || !tag || !excerpt || !body}
            onClick={() => void save(true)}
          >
            Yayınla
          </button>
          <button
            className="button"
            type="button"
            disabled={busy || !title || !tag || !excerpt || !body}
            onClick={() => void save(false)}
          >
            Taslak kaydet
          </button>
          {editingId && (
            <button className="text-link" type="button" onClick={reset}>
              Vazgeç
            </button>
          )}
        </div>
      </div>
      <button className="text-link" type="button" onClick={onSignOut}>
        Çıkış yap
      </button>
    </section>
  );
}
