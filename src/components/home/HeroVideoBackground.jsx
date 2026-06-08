import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches || document.documentElement.classList.contains("scavai-reduced-motion"));
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function getPosterUrl(media) {
  if (media?.thumbnailUrl) return media.thumbnailUrl;
  if (media?.mediaType === "video" && media?.fileUrl?.includes("/video/upload/")) {
    return media.fileUrl.replace("/video/upload/", "/video/upload/so_0,q_auto,f_jpg/").replace(/\.mp4($|\?)/, ".jpg$1");
  }
  return "";
}

export default function HeroVideoBackground({ desktop, tablet, mobile, className, children }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const media = mobile || tablet || desktop;
  const tabletMedia = tablet || desktop || mobile;
  const desktopMedia = desktop || tablet || mobile;
  const active = typeof window === "undefined" ? media : window.innerWidth >= 1024 ? desktopMedia : window.innerWidth >= 768 ? tabletMedia : media;
  const posterUrl = getPosterUrl(active);
  const canPlayVideo = active?.mediaType === "video" && active?.fileUrl && !failed && !reducedMotion && active?.isActive !== false && active?.status !== "archived";

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => setFailed(true));
  }, [canPlayVideo, active?.fileUrl]);

  return (
    <section className={cn("relative min-h-[88vh] overflow-hidden rounded-b-[2rem] bg-background md:mx-4 md:mt-4 md:min-h-[82vh] md:rounded-[2rem]", className)}>
      {canPlayVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          src={active.fileUrl}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          onError={() => setFailed(true)}
        />
      ) : posterUrl ? (
        <img src={posterUrl} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : active?.mediaType === "image" && active?.fileUrl ? (
        <img src={active.fileUrl} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-card to-primary/15" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(3,6,12,0.28),rgba(3,6,12,0.58)),radial-gradient(circle_at_center,rgba(255,178,64,0.16),transparent_55%),linear-gradient(to_top,rgba(3,6,12,0.82),transparent_45%)]" />
      <div className="relative z-20">{children}</div>
    </section>
  );
}