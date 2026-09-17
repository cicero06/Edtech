import { renderToString } from "react-dom/server";
import { App } from "./App";
export { pages, site } from "./config";
export function render(path: string) {
  return renderToString(<App path={path} />);
}
