import { readFile, writeFile, mkdir } from "node:fs/promises";
import { render, pages, site } from "../.ssr/entry-server.js";

// Published writer-console posts get real static pages on every deploy.
// The backend publish endpoint also pings the Vercel deploy hook, so a new
// post is folded into the site ~a minute after it goes live.
let remotePosts = [];
// VITE_API_URL may be relative ("/api", same-origin backend on Vercel). Node's
// fetch needs an absolute URL, so resolve it against the live production
// domain — the build reads posts from the currently deployed API.
function resolveApiBase(raw) {
  if (!raw || /^https?:\/\//.test(raw)) return raw;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}${raw.startsWith("/") ? "" : "/"}${raw}` : undefined;
}
const apiBase = resolveApiBase(process.env.VITE_API_URL?.replace(/\/$/, ""));
if (apiBase) {
  try {
    const res = await fetch(`${apiBase}/v2/blog/posts`);
    if (res.ok) remotePosts = await res.json();
  } catch {
    console.warn("prerender: remote posts fetch failed, static-only build");
  }
}
for (const p of remotePosts) {
  pages[`/blog/${p.slug}`] = {
    title: `${p.title} | Atlas Blog`,
    description: p.excerpt,
  };
}

const shell = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
for (const [path, meta] of Object.entries(pages)) {
  const url = site.origin + (path === "/" ? "/" : path);
  const tags = `<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"/><link rel="canonical" href="${url}"/><meta property="og:type" content="website"/><meta property="og:locale" content="tr_TR"/><meta property="og:site_name" content="${site.name}"/><meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${site.origin}/images/town.jpg"/><meta property="og:image:alt" content="Denge Kasabası oyunundaki kasaba görseli"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(meta.title)}"/><meta name="twitter:description" content="${escape(meta.description)}"/><meta name="twitter:image" content="${site.origin}/images/town.jpg"/>${path === "/404" || path === "/yazar" ? '<meta name="robots" content="noindex"/>' : ""}`;
  const out =
    path === "/"
      ? "dist/index.html"
      : path === "/404"
        ? "dist/404.html"
        : `dist${path}/index.html`;
  if (path !== "/" && path !== "/404")
    await mkdir(`dist${path}`, { recursive: true });
  await writeFile(
    out,
    shell
      .replace("<!--meta-->", tags)
      .replace("<!--app-->", render(path, remotePosts)),
  );
}
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`,
);
const urls = Object.keys(pages)
  .filter((path) => path !== "/404")
  .map((path) => `<url><loc>${site.origin}${path}</loc></url>`)
  .join("");
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
);
console.log(
  `Önceden oluşturuldu: ${Object.keys(pages).join(", ")}, robots.txt, sitemap.xml`,
);
