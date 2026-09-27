import { hydrateRoot, createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
const root = document.getElementById("root")!;
const app = <App path={window.location.pathname} />;
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
