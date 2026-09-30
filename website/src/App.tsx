import { useEffect } from "react";
import { pages } from "./config";
import { posts } from "./content";
import { startSmoothScroll } from "./motion";
import { Arrow } from "./components/Arrow";
import { Eyebrow } from "./components/Eyebrow";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPost } from "./pages/BlogPost";
import { Home } from "./pages/Home";
import { Partners } from "./pages/Partners";
import { Product } from "./pages/Product";

export function App({ path }: { path: string }) {
  const normalized = path.replace(/\/+$/, "") || "/";
  const product = normalized === "/denge-kasabasi";
  const gameRoute =
    normalized === "/denge-kasabasi/oyna" ||
    normalized.startsWith("/denge-kasabasi/oyna/") ||
    normalized === "/denge-kasabasi/ongosteri" ||
    normalized.startsWith("/denge-kasabasi/ongosteri/");
  const partners = normalized === "/kurumlar";
  const blogIndex = normalized === "/blog";
  const post = normalized.startsWith("/blog/")
    ? posts.find((p) => normalized === `/blog/${p.slug}`)
    : undefined;
  const known =
    normalized === "/" ||
    product ||
    gameRoute ||
    partners ||
    blogIndex ||
    !!post;
  const current = product || gameRoute
    ? "/denge-kasabasi"
    : partners
      ? "/kurumlar"
      : blogIndex || post
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
          ) : partners ? (
            <Partners />
          ) : blogIndex ? (
            <BlogIndex />
          ) : post ? (
            <BlogPost post={post} />
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
