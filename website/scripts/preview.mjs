import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  let file = resolve(root, "." + path);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403);
    return res.end();
  }
  let status = 200;
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    await stat(file);
  } catch {
    status = 404;
    file = resolve(root, "404.html");
  }
  try {
    const body = await readFile(file);
    res.writeHead(status, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500);
    res.end("Önce npm run build komutunu çalıştırın.");
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log("Atlas önizleme: http://127.0.0.1:4173"),
);
