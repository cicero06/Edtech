// Vercel serverless entry: every route is rewritten here (see vercel.json).
// `npm run build` (nest build) produces dist/ before functions are bundled.
export { default } from '../dist/serverless.js';
