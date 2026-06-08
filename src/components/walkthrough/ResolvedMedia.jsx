import { useEffect, useState } from "react";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { cleanMediaUrl, getSafeMediaUrl } from "@/lib/walkthrough-media-url";

function youtubeEmbed(url = "") {
  const value = cleanMediaUrl(url);
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

function vimeoEmbed(url = "") {
  const match = cleanMediaUrl(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : "";
}

export function getMediaKind(url = "", mediaType = "") {
  const type = String(mediaType || "").toLowerCase();
  const rawValue = cleanMediaUrl(url).toLowerCase();
  const value = rawValue.split("?")[0].split("#")[0];
  const hostedImage = /images\.unsplash\.com|images\.pexels\.com|images\.pixabay\.com/.test(rawValue);

  if (youtubeEmbed(url) || vimeoEmbed(url)) return "embed_video";
  if (hostedImage) return "image";
  if (type.includes("video") || ["mp4", "webm", "mov", "m4v"].includes(type) || /\.(mp4|webm|mov|m4v)$/.test(value)) return "video";
  if (type.includes("audio") || ["mp3", "wav", "ogg", "m4a"].includes(type) || /\.(mp3|wav|ogg|m4a)$/.test(value)) return "audio";
  if (type.includes("document") || type.includes("pdf") || /\.(pdf)$/.test(value)) return "document";
  if (type === "external_link" || type === "link") return "link";
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/.test(value) || type.includes("image")) return "image";
  return "link";
}

function LinkFallback({ url, label = "Open media" }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-24 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-white/15">
      {label}
    </a>
  );
}

export default function ResolvedMedia({ url, mediaType, alt = "Media", className = "", controls = false, autoPlay = true, muted = true, loop = true, fallbackVisual = false, fallbackCompact = false }) {
  const [failed, setFailed] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setFailed(false);
    setFallbackIndex(0);
  }, [url, mediaType]);

  const safeUrl = getSafeMediaUrl(url);
  if (!safeUrl) return fallbackVisual ? <WalkthroughFallbackVisual title="Media not available yet" description="This media asset is not available yet." compact={fallbackCompact} className={className || "h-full w-full"} /> : null;
  if (failed) return fallbackVisual ? <WalkthroughFallbackVisual title="Media not available yet" description="This media asset could not be loaded." compact={fallbackCompact} className={className || "h-full w-full"} /> : null;

  const initialKind = getMediaKind(safeUrl, mediaType);
  const fallbackKinds = initialKind === "image" && !mediaType ? ["image", "video", "audio", "link"] : [initialKind];
  const kind = fallbackKinds[fallbackIndex] || initialKind;
  const handleError = () => {
    if (fallbackIndex < fallbackKinds.length - 1) setFallbackIndex((value) => value + 1);
    else setFailed(true);
  };

  if (kind === "embed_video") {
    const embed = youtubeEmbed(safeUrl) || vimeoEmbed(safeUrl);
    return embed ? <iframe src={embed} title={alt} className={className || "aspect-video w-full rounded-2xl"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : null;
  }

  if (kind === "video") {
    return <video src={safeUrl} className={className} controls={controls} autoPlay={autoPlay && !controls} muted={muted} loop={loop} playsInline onError={handleError} aria-label={alt} />;
  }

  if (kind === "audio") {
    return <audio src={safeUrl} className={className} controls onError={handleError} aria-label={alt} />;
  }

  if (kind === "document") return <LinkFallback url={safeUrl} label="Open document" />;
  if (kind === "link") return <LinkFallback url={safeUrl} label={mediaType === "video" ? "Open video" : "Open media"} />;

  return <img src={safeUrl} alt={alt} className={className} onError={handleError} />;
}