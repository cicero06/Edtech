import { site } from "../config";
import { Arrow } from "./Arrow";

export function DemoLink({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`button ${light ? "light" : "primary"}`}
      href={site.demoUrl}
      target="_blank"
      rel="noreferrer"
    >
      Demoyu Oyna <Arrow />
    </a>
  );
}
