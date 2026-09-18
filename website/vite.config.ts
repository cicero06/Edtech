import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const gameDistRoot = resolve(__dirname, "denge-kasabasi-game", "dist");

const stringifyType = (file: string) => {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
};

const gameServePlugin = {
  name: "serve-game-dist",
  configureServer(server: any) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url ?? "/";
        if (!rawUrl.startsWith("/denge-kasabasi/oyna")) return next();

        const pathname = rawUrl.split("?")[0];
        const isRoot = pathname === "/denge-kasabasi/oyna" || pathname === "/denge-kasabasi/oyna/";
        const relPath = isRoot
          ? "/index.html"
          : pathname.replace(/^\/denge-kasabasi\/oyna/, "") || "/index.html";
        const filePath = resolve(gameDistRoot, `.${relPath}`);

        if (!existsSync(filePath)) {
          const fallbackPath = resolve(gameDistRoot, "index.html");
          if (!existsSync(fallbackPath)) return next();
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(readFileSync(fallbackPath, "utf8"));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", stringifyType(filePath));
        res.end(readFileSync(filePath));
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
