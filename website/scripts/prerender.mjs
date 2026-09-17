import { readFile, writeFile, mkdir } from "node:fs/promises";
import { render, pages, site } from "../.ssr/entry-server.js";
const shell = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
for (const [path, meta] of Object.entries(pages)) {
  const url = site.origin + (path === "/" ? "/" : path);
  const tags = `<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"/><link rel="canonical" href="${url}"/><meta property="og:type" content="website"/><meta property="og:locale" content="tr_TR"/><meta property="og:site_name" content="${site.name}"/><meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${site.origin}/images/town.jpg"/><meta property="og:image:alt" content="Denge Kasabası oyunundaki kasaba görseli"/>${path === "/404" ? '<meta name="robots" content="noindex"/>' : ""}`;
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
    shell.replace("<!--meta-->", tags).replace("<!--app-->", render(path)),
  );
}
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`,
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.origin}/</loc></url><url><loc>${site.origin}/denge-kasabasi</loc></url></urlset>`,
);
console.log(
  "Önceden oluşturuldu: /, /denge-kasabasi, 404.html, robots.txt, sitemap.xml",
);
