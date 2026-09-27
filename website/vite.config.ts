import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));

const gameMounts: [string, string][] = [
  [
    "/denge-kasabasi/oyna",
    resolve(__dirname, "denge-kasabasi-game", "dist"),
  ],
  [
    "/denge-kasabasi/ongosteri",
    resolve(__dirname, "denge-game-v2", "dist"),
  ],
];

const stringifyType = (file: string) => {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".ico")) return "image/x-icon";
  if (file.endsWith(".mp4")) return "video/mp4";
  if (file.endsWith(".webm")) return "video/webm";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".ogg")) return "audio/ogg";
  if (
    file.endsWith(".json") ||
    file.endsWith(".tmj") ||
    file.endsWith(".tsj")
  )
    return "application/json";
  if (file.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
};

const gameServePlugin = {
  name: "serve-game-dist",
  configureServer(server: any) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url ?? "/";
        const mount = gameMounts.find(([prefix]) =>
          rawUrl.startsWith(prefix),
        );
        if (!mount) return next();
        const [prefix, distRoot] = mount;

        const pathname = rawUrl.split("?")[0];
        const isRoot = pathname === prefix || pathname === `${prefix}/`;
        const relPath = isRoot
          ? "/index.html"
          : decodeURIComponent(pathname.slice(prefix.length)) ||
            "/index.html";
        const filePath = resolve(distRoot, `.${relPath}`);

        const send = (file: string) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", stringifyType(file));
          res.end(readFileSync(file));
        };

        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
          const indexFile = resolve(filePath, "index.html");
          if (existsSync(indexFile)) return send(indexFile);
        }
        if (!existsSync(filePath)) {
          const fallbackPath = resolve(distRoot, "index.html");
          if (!existsSync(fallbackPath)) return next();
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(readFileSync(fallbackPath, "utf8"));
          return;
        }

        send(filePath);
      },
    );
  },
};

export default defineConfig({
  plugins: [react(), gameServePlugin],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
