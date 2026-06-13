import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches || document.documentElement.classList.contains("scaverse-reduced-motion"));
    const onChange = () => setReduced(query.matches || document.documentElement.classList.contains("scaverse-reduced-motion"));
    query.addEventListener("change", onChange);
    window.addEventListener("scaverse-accessibility-change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("scaverse-accessibility-change", onChange);
    };
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

function MediaLayer({ media, className, allowVideo = false, atmosphere = false, mobileLayer = false, playVideoOnMobile = false, brightness, saturation }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const isVideo = media?.mediaType === "video";
  const canPlayVideo = isVideo && allowVideo && !reducedMotion && (!mobileLayer || playVideoOnMobile);

  useEffect(() => {
    if (!canPlayVideo || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => setFailed(true));
  }, [canPlayVideo, media?.fileUrl]);

  if (!media || failed || media.status === "archived" || media.isActive === false || !media.fileUrl) {
    return <div className={cn("absolute inset-0 bg-gradient-to-br from-background via-card to-primary/10", className)} />;
  }

  const focalStyle = {
    objectPosition: `${media.focusX ?? 50}% ${media.focusY ?? 50}%`,
    transform: media.zoom ? `scale(${media.zoom})` : undefined,
  };

  if (isVideo) {
    const posterUrl = getPosterUrl(media);
    if (!canPlayVideo) {
      return posterUrl ? (
        <img src={posterUrl} alt="" style={focalStyle} className={cn("absolute inset-0 h-full w-full object-cover", className)} onError={() => setFailed(true)} />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br from-background via-card to-primary/10", className)} />
      );
    }

    return (
      <video
        ref={videoRef}
        className={cn("absolute inset-0 h-full w-full object-cover", atmosphere && "opacity-55 blur-[1px]", className)}
        style={{ ...focalStyle, filter: `brightness(${brightness ?? (atmosphere ? 0.65 : 1)}) saturate(${saturation ?? (atmosphere ? 0.9 : 1)})` }}
        src={media.fileUrl}
        poster={posterUrl || undefined}
        autoPlay={media.autoplay !== false}
        loop={media.loop !== false}
        muted
        playsInline
        preload="metadata"
        controls={false}
        onError={() => setFailed(true)}
      />
    );
  }

  return <img src={media.fileUrl} alt="" style={focalStyle} className={cn("absolute inset-0 h-full w-full object-cover", className)} onError={() => setFailed(true)} />;
}

export default function MediaBackground({ desktop, tablet, mobile, overlayOpacity = 0.65, overlayColor = "6, 12, 24", blur = 0, brightness, saturation, allowVideo = false, atmosphere = false, playVideoOnMobile = false, className, children }) {
  const mobileMedia = mobile || tablet || desktop;
  const tabletMedia = tablet || desktop || mobile;
  const desktopMedia = desktop || tablet || mobile;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <MediaLayer media={mobileMedia} allowVideo={allowVideo} atmosphere={atmosphere} mobileLayer playVideoOnMobile={playVideoOnMobile} brightness={brightness} saturation={saturation} className="md:hidden" />
      <MediaLayer media={tabletMedia} allowVideo={allowVideo} atmosphere={atmosphere} brightness={brightness} saturation={saturation} className="hidden md:block lg:hidden" />
      <MediaLayer media={desktopMedia} allowVideo={allowVideo} atmosphere={atmosphere} brightness={brightness} saturation={saturation} className="hidden lg:block" />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(${overlayColor}, ${atmosphere ? Math.max(overlayOpacity, 0.45) : overlayOpacity})`, backdropFilter: blur || atmosphere ? `blur(${Math.max(blur, atmosphere ? 1 : 0)}px)` : undefined }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}