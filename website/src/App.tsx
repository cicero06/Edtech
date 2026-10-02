import { useEffect } from "react";
import { pages } from "./config";
import { posts, type Post } from "./content";
import { startSmoothScroll } from "./motion";
import { Arrow } from "./components/Arrow";
import { Eyebrow } from "./components/Eyebrow";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { BlogEditor } from "./pages/BlogEditor";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPostRoute } from "./pages/BlogPostRoute";
import { Home } from "./pages/Home";
import { Partners } from "./pages/Partners";
import { Product } from "./pages/Product";

export function App({ path, extraPosts = [] }: { path: string; extraPosts?: Post[] }) {
  const normalized = path.replace(/\/+$/, "") || "/";
  const product = normalized === "/denge-kasabasi";
  const gameRoute =
    normalized === "/denge-kasabasi/oyna" ||
    normalized.startsWith("/denge-kasabasi/oyna/") ||
    normalized === "/denge-kasabasi/ongosteri" ||
    normalized.startsWith("/denge-kasabasi/ongosteri/");
  const partners = normalized === "/kurumlar";
  const writer = normalized === "/yazar";
  const blogIndex = normalized === "/blog";
  const blogPath = normalized.startsWith("/blog/")
    ? normalized.slice("/blog/".length)
    : null;
  const post = blogPath
    ? [...posts, ...extraPosts].find((p) => blogPath === p.slug)
    : undefined;
  const known =
    normalized === "/" ||
    product ||
    gameRoute ||
    partners ||
    writer ||
    blogIndex ||
    blogPath !== null;
  const current = product || gameRoute
    ? "/denge-kasabasi"
    : partners
      ? "/kurumlar"
      : blogIndex || post || blogPath
        ? "/blog"
        : "";
  useEffect(() => {
    startSmoothScroll();
  }, []);
  useEffect(() => {
    const meta = pages[known ? (current || normalized) : "/404"];
    document.title = meta.title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.append(tag);
    }
    tag.setAttribute("content", meta.description);
  }, [known, current, normalized]);
  return (
    <>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <Header current={current} />
      <main id="main">
        {known ? (
          product || gameRoute ? (
            <Product />
          ) : writer ? (
            <BlogEditor />
          ) : partners ? (
            <Partners />
          ) : blogIndex ? (
            <BlogIndex />
          ) : blogPath ? (
            <BlogPostRoute slug={blogPath} remotePosts={extraPosts} />
          ) : (
            <Home />
          )
        ) : (
          <section className="container not-found">
            <Eyebrow>404 · SAYFA BULUNAMADI</Eyebrow>
            <h1>
              Bu yol başka bir
              <br />
              yere çıkıyor.
            </h1>
            <p>
              Aradığınız sayfa bulunamadı. Keşfe ana sayfadan devam
              edebilirsiniz.
            </p>
            <a className="button primary" href="/">
              Ana sayfaya dön <Arrow />
            </a>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
