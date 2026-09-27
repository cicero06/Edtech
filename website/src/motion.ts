import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

let lenis: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function startSmoothScroll() {
  if (lenis || typeof window === "undefined" || prefersReducedMotion()) return;
  lenis = new Lenis({ lerp: 0.11, anchors: { offset: -92 } });
  lenis.on("scroll", ScrollTrigger.update);
  rafCallback = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(rafCallback);
  gsap.ticker.lagSmoothing(0);
  const { hash } = window.location;
  if (hash) {
    requestAnimationFrame(() => {
      const el = document.querySelector(hash);
      if (el) lenis?.scrollTo(el as HTMLElement, { immediate: true, offset: -92 });
    });
  }
}

export { gsap, ScrollTrigger };
