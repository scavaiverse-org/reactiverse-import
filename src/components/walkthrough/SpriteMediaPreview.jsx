import { useState } from "react";
import { FileText, Image as ImageIcon, Link, Volume2, Video } from "lucide-react";
import { detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";

function getSpriteUrl(sprite = {}) {
  return sprite.active_museum_media_url || sprite.processed_sprite_url || sprite.media_url || sprite.image_url || sprite.file_url || sprite.video_url || sprite.audio_url || "";
}

function getSpriteType(sprite = {}, url = "") {
  return String(sprite.media_type || sprite.artifact_type || sprite.type || detectMediaTypeFromUrl(url, "link") || "link").toLowerCase();
}

function IconFallback({ type, title }) {
  const Icon = type.includes("video") ? Video : type === "audio" ? Volume2 : type === "document" ? FileText : type === "link" ? Link : ImageIcon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-white/20 bg-background/75 p-2 text-center text-[10px] text-foreground shadow-2xl backdrop-blur-md">
      <Icon className="mb-1 h-5 w-5 text-primary" />
      <span className="line-clamp-2 leading-tight">{title || (type === "document" ? "Document" : type === "audio" ? "Audio" : type.includes("video") ? "Video" : "Artifact")}</span>
    </div>
  );
}

export default function SpriteMediaPreview({ sprite = {}, className = "", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false);
  const url = getSpriteUrl(sprite);
  const type = getSpriteType(sprite, url);
  const title = sprite.title || sprite.header || "Museum artifact";

  if (!url || failed) return <IconFallback type={type || "link"} title={title} />;

  if (type === "image" || /\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/i.test(url)) {
    return <img src={url} alt={title} className={className || "h-full w-full select-none object-contain drop-shadow-2xl"} draggable="false" onError={() => setFailed(true)} />;
  }

  if (type.includes("video") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) {
    return <video src={url} className={className || "h-full w-full object-contain drop-shadow-2xl"} muted playsInline loop preload="metadata" onError={() => setFailed(true)} />;
  }

  return <IconFallback type={type} title={title} className={fallbackClassName} />;
}