import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

import { estimateInitialFocusCrop } from "@/lib/sprite-image-processing";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function SubjectCropCanvas({ sourceUrl, imageSize, crop, onCropChange, onAutoCrop }) {
  const [drag, setDrag] = useState(null);
  const hasValidImageSize = imageSize && imageSize.width > 24 && imageSize.height > 24;
  const fallbackCrop = useMemo(() => hasValidImageSize ? estimateInitialFocusCrop(imageSize.width, imageSize.height) : null, [hasValidImageSize, imageSize]);
  const activeCrop = crop || fallbackCrop;

  useEffect(() => {
    if (!crop && fallbackCrop && hasValidImageSize) onCropChange?.(fallbackCrop);
  }, [crop, fallbackCrop, hasValidImageSize, onCropChange]);

  if (!sourceUrl || !hasValidImageSize || !activeCrop) return <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-sm text-muted-foreground">Preparing crop tool...</div>;

  const toPercent = (value, total) => `${(value / total) * 100}%`;
  const updateCrop = (patch) => {
    const next = { ...activeCrop, ...patch };
    onCropChange?.({
      ...next,
      x: clamp(next.x, 0, imageSize.width - 1),
      y: clamp(next.y, 0, imageSize.height - 1),
      width: clamp(next.width, 24, imageSize.width - next.x),
      height: clamp(next.height, 24, imageSize.height - next.y),
      method: "manual_focus_box",
      confidence: 0.6,
    });
  };

  const handlePointer = (event) => {
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * imageSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * imageSize.height;
    if (drag === "move") updateCrop({ x: x - activeCrop.width / 2, y: y - activeCrop.height / 2 });
    if (drag === "resize") updateCrop({ width: x - activeCrop.x, height: y - activeCrop.y });
  };

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto max-h-[28rem] w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 touch-none"
        style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
        onPointerMove={handlePointer}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <img src={sourceUrl} alt="Original artifact" className="h-full w-full object-fill" />
        <div className="pointer-events-none absolute inset-0 bg-black/35" />
        <div
          className="absolute border-2 border-primary bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          style={{
            left: toPercent(activeCrop.x, imageSize.width),
            top: toPercent(activeCrop.y, imageSize.height),
            width: toPercent(activeCrop.width, imageSize.width),
            height: toPercent(activeCrop.height, imageSize.height),
          }}
          onPointerDown={(event) => { event.stopPropagation(); setDrag("move"); }}
        >
          <button type="button" onPointerDown={(event) => { event.stopPropagation(); setDrag("resize"); }} className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border border-primary bg-background" aria-label="Resize crop" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">Drag the box to choose the subject area.</div>
        <Button type="button" variant="outline" size="sm" onClick={() => onAutoCrop?.()}>Apply Focus Box</Button>
      </div>
    </div>
  );
}