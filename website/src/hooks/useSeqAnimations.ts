import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "../motion";

export function useSeqAnimations(
  root: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const seq = root.current?.querySelector<HTMLElement>(".seq");
      const map = root.current?.querySelector<HTMLElement>(".seq-map");
      if (!seq || !map) return;
      const W = () => map.offsetWidth;
      const H = () => map.offsetHeight;
      const cam = (px: number, py: number, s: number) => ({
        x: () => (0.5 - px) * W() * s,
        y: () => (0.5 - py) * H() * s,
        scale: s,
        ease: "power1.inOut" as const,
      });
      const fit = () =>
        Math.min(window.innerWidth / W(), window.innerHeight / H());
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: seq,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        map,
        { x: 0, y: 0, scale: () => fit() * 0.92 },
        { x: 0, y: 0, scale: () => fit() * 0.92, duration: 0.01 },
        0,
      );
      tl.to(map, { ...cam(0.5, 0.13, 2.4), duration: 3 }, 2)
        .to(map, { ...cam(0.16, 0.47, 2.4), duration: 3 }, 6)
        .to(map, { ...cam(0.5, 0.5, 2.6), duration: 3 }, 10)
        .to(map, { ...cam(0.84, 0.5, 2.4), duration: 3 }, 14)
        .to(map, { ...cam(0.5, 0.88, 2.4), duration: 3 }, 18)
        .to(map, { ...cam(0.5, 0.5, 1.35), duration: 3 }, 22);
      const beats: [string, number, number][] = [
        [".seq-t1", 0.3, 1.8],
        [".seq-t2", 3.4, 5.4],
        [".seq-t3", 7.4, 9.4],
        [".seq-t4", 11.4, 13.4],
        [".seq-t5", 15.4, 17.4],
        [".seq-t6", 19.4, 21.4],
        [".seq-end", 22.6, 25],
      ];
      beats.forEach(([sel, at, out]) => {
        tl.fromTo(
          sel,
          { opacity: 0, y: 44 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          at,
        );
        if (out < 24) {
          tl.to(
            sel,
            { opacity: 0, y: -32, duration: 0.5, ease: "power2.in" },
            out,
          );
        }
      });
      tl.to(".seq-hint", { opacity: 0, duration: 0.4 }, 0.8);
    }, root);
    return () => ctx.revert();
  }, [root]);
}
