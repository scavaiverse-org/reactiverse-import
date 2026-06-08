import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isExperienceFeatureEnabled } from "@/lib/experience-feature-flags";

const PUBLIC_EXCLUDED_PREFIXES = ["/platform/admin", "/admin", "/login", "/tenant-login"];
const CARD_SELECTOR = "article, section > div, a[href], button, [class*='Card'], [class*='card'], [class*='rounded-2xl'], [class*='rounded-3xl']";
const TEXT_SELECTOR = "h1, h2, h3, h4, p, span, li, label";

export default function PublicImmersiveLayer({ children }) {
  const location = useLocation();
  const rootRef = useRef(null);

  const enabled = useMemo(() => {
    if (!isExperienceFeatureEnabled("ENABLE_IMMERSIVE_PUBLIC_UI")) return false;
    return !PUBLIC_EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  }, [location.pathname]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    root.classList.add("public-immersive-root");
    const cards = Array.from(root.querySelectorAll(CARD_SELECTOR)).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    const textNodes = Array.from(root.querySelectorAll(TEXT_SELECTOR)).filter((node) => node instanceof HTMLElement && node.textContent?.trim());

    cards.forEach((card, index) => {
      card.classList.add("public-immersive-card");
      card.style.setProperty("--immersive-delay", `${Math.min(index * 35, 420)}ms`);
    });
    textNodes.forEach((node, index) => {
      node.classList.add("public-cinematic-text");
      node.style.setProperty("--text-delay", `${Math.min(index * 18, 360)}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const phase = entry.intersectionRatio >= 0.6 ? "full" : entry.intersectionRatio >= 0.3 ? "active" : entry.isIntersecting ? "quiet" : "static";
        entry.target.setAttribute("data-immersive-phase", phase);
      });
    }, { threshold: [0, 0.3, 0.6, 1], rootMargin: "0px 0px -8% 0px" });

    cards.forEach((card) => observer.observe(card));

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        root.style.setProperty("--public-scroll-depth", `${Math.min(window.scrollY / maxScroll, 1)}`);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("public-immersive-root");
    };
  }, [enabled, location.pathname]);

  return <div ref={rootRef} data-public-immersive-root={enabled ? "true" : "false"}>{children}</div>;
}