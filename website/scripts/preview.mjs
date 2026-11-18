import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { handleAiRequest } from "../api/ai.js";
const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".json": "application/json",
  ".tmj": "application/json",
  ".tsj": "application/json",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  if (path.startsWith("/api/ai/") || path.startsWith("/ai/")) {
    const stripped = path.replace(/^\/api/, "");
    return handleAiRequest(req, res, stripped);
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
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
    const fileStat = await stat(file);
    const total = fileStat.size;
    const range = req.headers.range;
    const contentType = types[extname(file)] || "application/octet-stream";

    if (range && status === 200) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunksize = end - start + 1;
      const fileData = await readFile(file);
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      });
      return res.end(req.method === "HEAD" ? undefined : fileData.subarray(start, end + 1));
    }

    const body = await readFile(file);
    res.writeHead(status, {
      "Content-Type": contentType,
      "Content-Length": total,
      "Accept-Ranges": "bytes",
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
