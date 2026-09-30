import { useRef } from "react";
import { site } from "../config";
import { type Post } from "../content";
import { Arrow } from "../components/Arrow";
import { Contact } from "../components/Contact";
import { Eyebrow } from "../components/Eyebrow";
import { useReveals } from "../hooks/useReveals";

export function BlogPost({ post }: { post: Post }) {
  const root = useRef<HTMLDivElement>(null);
  useReveals(root);
  return (
    <div ref={root}>
      <article className="section container post">
        <div data-reveal>
          <a className="breadcrumb" href="/blog">
            Blog <span aria-hidden="true">/</span>
          </a>
          <Eyebrow>{post.tag.toLocaleUpperCase("tr")}</Eyebrow>
          <h1>{post.title}</h1>
          <p className="post-meta">
            <time dateTime="2026-09">{post.date}</time> · Atlas Ekibi
          </p>
        </div>
        <div className="post-body" data-reveal>
          {post.body.map((b, i) =>
            "h" in b ? (
              <h2 key={i}>{b.h}</h2>
            ) : "ul" in b ? (
              <ul key={i}>
                {b.ul.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={i}>{b.p}</p>
            ),
          )}
        </div>
        <div className="post-foot" data-reveal>
          <a className="text-link" href="/blog">
            Tüm yazılara dön <Arrow />
          </a>
          <a className="text-link" href={`mailto:${site.email}`}>
            Bu konuda bize yazın <Arrow />
          </a>
        </div>
      </article>
      <Contact />
    </div>
  );
}
