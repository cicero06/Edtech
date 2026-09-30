import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "../motion";

function splitWords(el: HTMLElement) {
  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (node.textContent || "").split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        }
      });
      node.replaceWith(frag);
    } else if (node instanceof HTMLElement && node.tagName !== "BR") {
      splitWords(node);
    }
  });
}
export function useHomeAnimations(
  root: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 42,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.from(".hero-art", {
        y: 70,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        delay: 0.15,
      });
      gsap.to(".hero-art > img", {
        yPercent: 8,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      const manifesto =
        root.current?.querySelector<HTMLElement>(".intro-inner h2");
      if (manifesto) {
        splitWords(manifesto);
        gsap.fromTo(
          manifesto.querySelectorAll(".w"),
          { opacity: 0.2 },
          {
            opacity: 1,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: {
              trigger: manifesto,
              start: "top 82%",
              end: "top 35%",
              scrub: true,
            },
          },
        );
      }
      const sysMap =
        root.current?.querySelector<HTMLElement>(".system-map");
      if (sysMap) {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sysMap, start: "top 82%", once: true },
        });
        tl.from(sysMap.querySelectorAll(".sys-node"), {
          scale: 0.5,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.18,
        }).from(
          sysMap.querySelectorAll(".sys-link"),
          {
            scaleX: 0,
            duration: 0.45,
            ease: "power2.out",
            stagger: 0.18,
          },
          0.2,
        );
      }
      const props = gsap.utils.toArray<HTMLElement>(".hero-prop");
      const hero = root.current?.querySelector<HTMLElement>(".hero");
      if (hero && props.length) {
        const depths = [34, -22, 26];
        const qx = props.map((prop) =>
          gsap.quickTo(prop, "x", { duration: 0.9, ease: "power3.out" }),
        );
        const qy = props.map((prop) =>
          gsap.quickTo(prop, "y", { duration: 0.9, ease: "power3.out" }),
        );
        const onMove = (e: MouseEvent) => {
          const r = hero.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          props.forEach((prop, i) => {
            const d = depths[i % depths.length];
            qx[i](nx * d);
            qy[i](ny * d * 0.7);
          });
        };
        hero.addEventListener("mousemove", onMove);
        cleanups.push(() => hero.removeEventListener("mousemove", onMove));
      }
      const tiltCards = gsap.utils.toArray<HTMLElement>(
        ".future-grid article, .team-card",
      );
      tiltCards.forEach((card) => {
        const rx = gsap.quickTo(card, "rotationX", {
          duration: 0.6,
          ease: "power3.out",
        });
        const ry = gsap.quickTo(card, "rotationY", {
          duration: 0.6,
          ease: "power3.out",
        });
        const onTilt = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("mousemove", onTilt);
        card.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", onTilt);
          card.removeEventListener("mouseleave", onLeave);
        });
      });
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const pinEl =
          root.current?.querySelector<HTMLElement>(".how-to-pin");
        const track =
          root.current?.querySelector<HTMLElement>(".how-to-tutorial");
        const bar = root.current?.querySelector<HTMLElement>(
          ".how-to-progress span",
        );
        if (!pinEl || !track) return;
        const distance = () =>
          Math.max(track.scrollWidth - window.innerWidth + 48, 0);
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinEl,
            start: "top top+=92",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        if (bar) {
          gsap.to(bar, {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: pinEl,
              start: "top top+=92",
              end: () => `+=${distance()}`,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }, root);
    return () => {
      ctx.revert();
      cleanups.forEach((fn) => fn());
    };
  }, [root]);
}
