// Same-origin backend: every /api/* request is rewritten here (vercel.json)
// and handed to either the Pedagogical AI engine (/api/ai/*) or the NestJS
// app built from demo/backend.
import handler from "../../demo/backend/dist/serverless.js";
import { handleAiRequest } from "./ai.js";

export default function api(req, res) {
  // Nest routes are /v2/..., /sessions, / — strip the /api prefix.
  const stripped = (req.url ?? "/").replace(/^\/api(?=[/?]|$)/, "");
  const normalized = stripped.startsWith("/") ? stripped : `/${stripped}`;
  if (normalized === "/ai" || normalized.startsWith("/ai/")) {
    return handleAiRequest(req, res, normalized);
  }
  req.url = normalized;
  return handler(req, res);
}
