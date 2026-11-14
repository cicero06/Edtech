// Same-origin backend: every /api/* request is rewritten here (vercel.json)
// and handed to the NestJS app built from demo/backend (outside the Root
// Directory — Vercel's "include files outside root" setting must stay on).
import handler from "../../demo/backend/dist/serverless.js";

export default function api(req, res) {
  // Nest routes are /v2/..., /sessions, / — strip the /api prefix.
  const stripped = (req.url ?? "/").replace(/^\/api(?=[/?]|$)/, "");
  req.url = stripped.startsWith("/") ? stripped : `/${stripped}`;
  return handler(req, res);
}
