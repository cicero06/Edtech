import { useEffect, useRef, useState } from "react";
import { posts, type Post } from "../content";
import { fetchPublishedPosts } from "../api";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { Eyebrow } from "../components/Eyebrow";
import { useReveals } from "../hooks/useReveals";

export function BlogIndex() {
  const root = useRef<HTMLDivElement>(null);
  const [remotePosts, setRemotePosts] = useState<Post[]>([]);
  useReveals(root);
  useEffect(() => {
    fetchPublishedPosts()
      .then(setRemotePosts)
      .catch(() => setRemotePosts([]));
  }, []);
  const staticSlugs = new Set(posts.map((p) => p.slug));
  const list = [
    ...remotePosts.filter((p) => !staticSlugs.has(p.slug)),
    ...posts,
  ];
  return (
    <div ref={root}>
      <section className="section container blog-index">
        <div data-reveal>
          <a className="breadcrumb" href="/">
            Atlas <span aria-hidden="true">/</span>
          </a>
          <Eyebrow>ATLAS BLOG</Eyebrow>
          <h1>Sahadan notlar.</h1>
          <p className="blog-intro">
            Tasarım kararlarımızı, pedagojik yaklaşımımızı ve geliştirme
            sürecini şeffaf şekilde burada paylaşıyoruz.
          </p>
        </div>
        <div className="blog-list" data-reveal-group>
          {list.map((p) => (
            <a className="blog-card" key={p.slug} href={`/blog/${p.slug}`}>
              <div className="blog-card__meta">
                <span className="vtag">{p.tag}</span>
                <time dateTime="2026-09">{p.date}</time>
              </div>
              <h2>{p.title}</h2>
              <p>{p.excerpt}</p>
              <span className="blog-card__cta">
                Yazıyı oku <Arrow />
              </span>
            </a>
          ))}
        </div>
      </section>
      <Contact />
    </div>
  );
}
