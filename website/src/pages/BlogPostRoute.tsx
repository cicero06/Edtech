import { useEffect, useState } from "react";
import { posts, type Post } from "../content";
import { fetchPublishedPost } from "../api";
import { Arrow } from "../components/Arrow";
import { Eyebrow } from "../components/Eyebrow";
import { BlogPost } from "./BlogPost";

/**
 * Resolves /blog/<slug>: statically bundled posts first, then published
 * remote posts (writer console). During SSG, remotePosts carries the
 * build-time snapshot so published posts prerender to real pages.
 */
export function BlogPostRoute({
  slug,
  remotePosts = [],
}: {
  slug: string;
  remotePosts?: Post[];
}) {
  const allPosts = [...posts, ...remotePosts];
  const bundled = allPosts.find((p) => p.slug === slug);
  const [remote, setRemote] = useState<Post | null | "loading">(
    bundled ? null : "loading",
  );

  useEffect(() => {
    if (bundled || typeof window === "undefined") return;
    fetchPublishedPost(slug)
      .then(setRemote)
      .catch(() => setRemote(null));
  }, [slug, bundled]);

  useEffect(() => {
    if (remote && remote !== "loading") {
      document.title = `${remote.title} | Atlas Blog`;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", remote.excerpt);
    }
  }, [remote]);

  const post = bundled ?? (remote === "loading" ? undefined : remote);

  if (post) return <BlogPost post={post} />;
  if (remote === "loading") return null;
  return (
    <section className="container not-found">
      <Eyebrow>404 · SAYFA BULUNAMADI</Eyebrow>
      <h1>
        Bu yol başka bir
        <br />
        yere çıkıyor.
      </h1>
      <p>Aradığınız yazı bulunamadı.</p>
      <a className="button primary" href="/blog">
        Bloga dön <Arrow />
      </a>
    </section>
  );
}
