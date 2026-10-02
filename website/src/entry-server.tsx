import { renderToString } from "react-dom/server";
import { App } from "./App";
import type { Post } from "./content";
export { pages, site } from "./config";
export function render(path: string, extraPosts: Post[] = []) {
  return renderToString(<App path={path} extraPosts={extraPosts} />);
}
