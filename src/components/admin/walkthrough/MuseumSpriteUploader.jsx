import { useState } from "react";
import { Upload, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SpritePhotoshopPanel from "./SpritePhotoshopPanel";
import { normalizeSpriteAsset } from "@/lib/sprite-image-processing";
import { detectMediaTypeFromFile } from "@/lib/walkthrough-media-bindings";

function blobToFile(blob, name = "prepared-museum-sprite.png") {
  return new File([blob], name, { type: blob.type || "image/png" });
}

export default function MuseumSpriteUploader({ label = "Upload artifact file", existingSprite, selectedSprite, openEditor = false, onSpriteReady, onInsert, onUpdate, onCancel }) {
  const currentSprite = existingSprite || selectedSprite;
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [metadataDraft, setMetadataDraft] = useState({ title: currentSprite?.title || "", caption: currentSprite?.caption || "", sprite_type: currentSprite?.sprite_type || "floor-artifact-sprite", placement_mode: currentSprite?.floor_locked === false ? "free" : "floor" });
  const fileType = file ? detectMediaTypeFromFile(file) : "image";

  const emitSprite = (sprite) => {
    onSpriteReady?.(sprite);
    if (currentSprite?.id && onUpdate) onUpdate(currentSprite.id, sprite);
    else onInsert?.(sprite);
  };

  const uploadOriginal = async () => {
    if (!file && (currentSprite?.original_media_url || currentSprite?.media_url)) return { file_url: currentSprite.original_media_url || currentSprite.media_url };
    return uploadFile(file);
  };

  const acceptProcessed = async ({ blob, metadata }) => {
    if (!metadata?.validation_passed) {
      setStatus("Subject isolation did not pass validation. Refine the sprite before inserting.");
      return;
    }
    const shouldUpdateExisting = !!currentSprite?.id && !file;
    const spriteId = shouldUpdateExisting ? currentSprite.id : crypto.randomUUID();
    const localUrl = URL.createObjectURL(blob);
    const baseSprite = shouldUpdateExisting ? (currentSprite || {}) : {};
    const localSprite = normalizeSpriteAsset({
    ...baseSprite,
    id: spriteId,
    title: metadataDraft.title || baseSprite.title || file?.name || "Artifact sprite",
    caption: metadataDraft.caption || baseSprite.caption || "",
    header: metadataDraft.caption || baseSprite.header || "",
    sprite_type: metadataDraft.sprite_type || baseSprite.sprite_type || "floor-artifact-sprite",
    floor_locked: metadataDraft.placement_mode !== "free",
      original_media_url: baseSprite.original_media_url || baseSprite.media_url || localUrl,
      processed_sprite_url: localUrl,
      active_museum_media_url: localUrl,
      media_url: localUrl,
      artifact_type: "image",
      media_type: "image",
      sprite_mode_enabled: true,
      sprite_processing: metadata,
    });

    onSpriteReady?.(localSprite);
    if (shouldUpdateExisting) onUpdate?.(spriteId, localSprite);
    else onInsert?.(localSprite);

    setFile(null);
    setStatus("Adding sprite to museum…");

    try {
      const processed = await uploadFile(blobToFile(blob));
      let originalUrl = baseSprite.original_media_url || baseSprite.media_url || processed.file_url;

      if (file) {
        try {
          const original = await uploadOriginal();
          originalUrl = original.file_url || originalUrl;
        } catch {
          originalUrl = processed.file_url;
        }
      }

      const savedSprite = normalizeSpriteAsset({
        ...localSprite,
        original_media_url: originalUrl,
        processed_sprite_url: processed.file_url,
        active_museum_media_url: processed.file_url,
        media_url: processed.file_url,
        sprite_processing: metadata,
      });

      onSpriteReady?.(savedSprite);
      if (shouldUpdateExisting) onUpdate?.(spriteId, savedSprite);
      else onInsert?.(savedSprite);
      setStatus("");
    } catch {
      setStatus("Sprite added to preview. Save may need another upload attempt.");
    }
  };

  const useOriginal = async () => {
    setStatus(fileType === "image" ? "Saving original image…" : "Saving artifact file…");
    try {
      const original = await uploadOriginal();
      const sprite = normalizeSpriteAsset({
        ...(currentSprite || {}),
        title: metadataDraft.title || currentSprite?.title || file?.name || "Artifact sprite",
        caption: metadataDraft.caption || currentSprite?.caption || "",
        header: metadataDraft.caption || currentSprite?.header || "",
        sprite_type: metadataDraft.sprite_type || currentSprite?.sprite_type || "floor-artifact-sprite",
        floor_locked: metadataDraft.placement_mode !== "free",
        original_media_url: original.file_url,
        active_museum_media_url: original.file_url,
        media_url: original.file_url,
        processed_sprite_url: fileType === "image" ? original.file_url : "",
        artifact_type: fileType,
        media_type: fileType,
        sprite_mode_enabled: true,
        sprite_processing: {
          processing_method: fileType === "image" ? "original_image" : "original_file",
          method: fileType === "image" ? "original_image" : "original_file",
          background_removed: false,
          transparent_background: false,
          subject_detected: false,
          subject_confidence: 0,
          crop_applied: false,
          edited_by_user: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      emitSprite(sprite);
      setFile(null);
      setStatus("");
    } catch {
      setStatus("Upload failed. Please try a smaller file or another format.");
    }
  };

  if (file && fileType !== "image") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-background/50 p-2 text-xs text-muted-foreground">
        <span>{file.name} will render as a {fileType} artifact card.</span>
        <Button size="sm" variant="outline" onClick={useOriginal}>Add file sprite</Button>
        <Button size="sm" variant="ghost" onClick={() => { setFile(null); onCancel?.(); }}>Cancel</Button>
        {status && <span>{status}</span>}
      </div>
    );
  }

  if (file || (openEditor && (currentSprite?.original_media_url || currentSprite?.media_url))) {
    return (
      <div className="space-y-2">
        <SpritePhotoshopPanel file={file} originalUrl={!file ? currentSprite?.original_media_url || currentSprite?.media_url : ""} onAccept={acceptProcessed} onUseOriginal={useOriginal} onCancel={() => { setFile(null); onCancel?.(); }} />
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-9 w-40" value={metadataDraft.title} onChange={(event) => setMetadataDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Artifact title" />
      <Input className="h-9 w-44" value={metadataDraft.caption} onChange={(event) => setMetadataDraft((draft) => ({ ...draft, caption: event.target.value }))} placeholder="Short caption" />
      <select value={metadataDraft.sprite_type} onChange={(event) => setMetadataDraft((draft) => ({ ...draft, sprite_type: event.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-xs">
        <option value="floor-artifact-sprite">Floor artifact</option>
        <option value="wall-artifact-sprite">Wall artifact</option>
        <option value="costume-sprite">Costume</option>
        <option value="mask-sprite">Mask</option>
        <option value="instrument-sprite">Instrument</option>
      </select>
      <select value={metadataDraft.placement_mode} onChange={(event) => setMetadataDraft((draft) => ({ ...draft, placement_mode: event.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-xs">
        <option value="floor">Place on floor</option>
        <option value="free">Free placement</option>
      </select>
      <Button asChild variant="outline">
        <label className="cursor-pointer">
          <Upload className="h-4 w-4" /> {label} <Wand2 className="h-4 w-4" />
          <input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
      </Button>
    </div>
  );
}