import { useRef, useState } from "react";
import { Copy, Layers, Lock, RotateCw, ShieldCheck, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeRoomLayoutForArtifactPlacement, applyManualFloorOverride, clampArtifactToSafeZone, getDefaultArtifactPlacement } from "@/lib/room-semantic-layout";
import MuseumSpriteUploader from "./MuseumSpriteUploader";
import MuseumCoCuratorPanel from "./MuseumCoCuratorPanel";
import SpriteMediaPreview from "@/components/walkthrough/SpriteMediaPreview";

function getRoomImage(room) {
  return room?.background_media_url || room?.media_url || "";
}

const easySteps = ["Room Setup", "Scrollable Room", "Museum Mode", "Upload Artifact", "Remove Background", "Place on Floor", "Add Story", "Add Video", "Add Music", "Preview", "Publish Check"];

export default function MuseumModeEditor({ room, onChange, advanced = false }) {
  const boardRef = useRef(null);
  const [selectedId, setSelectedId] = useState(room.artifact_sprites?.[0]?.id || "");
  const [drag, setDrag] = useState(null);
  const sprites = room.artifact_sprites || [];
  const selected = sprites.find((sprite) => sprite.id === selectedId) || sprites[0] || null;
  const semanticLayout = room.room_semantic_layout || analyzeRoomLayoutForArtifactPlacement({ imageUrl: getRoomImage(room) });
  const enabled = !!room.museum_mode_enabled || !!room.artifact_placement_enabled;
  const baseline = Number(semanticLayout.floor_baseline_y || 86);

  const updateRoom = (patch) => onChange?.({ ...room, ...patch });
  const setEnabled = (checked) => updateRoom({ museum_mode_enabled: checked, artifact_placement_enabled: checked, room_semantic_layout: semanticLayout });
  const setSemanticLayout = (layout, reclamp = true) => updateRoom({
    museum_mode_enabled: true,
    artifact_placement_enabled: true,
    room_semantic_layout: layout,
    artifact_sprites: reclamp ? sprites.map((sprite) => clampArtifactToSafeZone({ artifact: sprite, semanticLayout: layout, snapToFloor: sprite.floor_locked !== false })) : sprites,
  });
  const updateSprite = (id, patch, snap = false) => {
    const nextSprites = sprites.map((sprite) => sprite.id === id ? clampArtifactToSafeZone({ artifact: { ...sprite, ...patch, last_edited_from_mode: advanced ? "expert" : "easy" }, semanticLayout, snapToFloor: snap }) : sprite);
    updateRoom({ museum_mode_enabled: true, artifact_placement_enabled: true, artifact_sprites: nextSprites, room_semantic_layout: semanticLayout });
  };

  const addSpriteAsset = (asset = {}) => {
    const base = getDefaultArtifactPlacement({ room, semanticLayout });
    const sprite = clampArtifactToSafeZone({
      artifact: { ...base, ...asset, id: asset.id || base.id, media_url: asset.active_museum_media_url || asset.processed_sprite_url || asset.media_url, title: asset.title || `Artifact ${sprites.length + 1}`, created_from_mode: advanced ? "expert" : "easy", last_edited_from_mode: advanced ? "expert" : "easy" },
      semanticLayout,
      snapToFloor: true,
    });
    updateRoom({ museum_mode_enabled: true, artifact_placement_enabled: true, room_semantic_layout: semanticLayout, artifact_sprites: [...sprites, sprite] });
    setSelectedId(sprite.id);
  };

  const updateSpriteAsset = (id, asset = {}) => updateSprite(id, { ...asset, media_url: asset.active_museum_media_url || asset.processed_sprite_url || asset.media_url }, true);
  const removeSprite = (id) => { const next = sprites.filter((sprite) => sprite.id !== id); updateRoom({ artifact_sprites: next }); setSelectedId(next[0]?.id || ""); };
  const duplicateSprite = (sprite) => {
    const copy = clampArtifactToSafeZone({ artifact: { ...sprite, id: crypto.randomUUID(), title: `${sprite.title || "Artifact"} Copy`, x: Number(sprite.x || 50) + 4 }, semanticLayout, snapToFloor: sprite.floor_locked !== false });
    updateRoom({ artifact_sprites: [...sprites, copy] });
    setSelectedId(copy.id);
  };

  const pointerToPercent = (event) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const rect = boardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  };

  const onPointerMove = (event) => {
    if (!drag || !selected || selected.locked) return;
    const point = pointerToPercent(event);
    if (drag.type === "move") updateSprite(selected.id, { x: point.x - drag.offsetX, y: point.y - drag.offsetY }, selected.floor_locked !== false);
    if (drag.type === "resize") updateSprite(selected.id, { width: Math.max(6, point.x - Number(selected.x || 0)), height: Math.max(8, point.y - Number(selected.y || 0)) }, selected.floor_locked !== false);
  };

  const analyzeImage = (image) => {
    setSemanticLayout(analyzeRoomLayoutForArtifactPlacement({ imageUrl: getRoomImage(room), imageWidth: image?.naturalWidth, imageHeight: image?.naturalHeight }));
  };
  const lowConfidence = Number(semanticLayout.floor_confidence || semanticLayout.confidence || 0) < 0.58;
  const qaWarnings = [
    !getRoomImage(room) && "Room image missing",
    lowConfidence && "Floor estimated — expert review recommended",
    selected?.floor_locked && Math.abs(Number(selected.floor_contact_y || 0) - baseline) > 3 && "Selected artifact may be floating",
    selected && !selected.description && !selected.caption && "Selected artifact needs a caption",
  ].filter(Boolean);

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold">SCAVerse Spatial Museum Editor</h3>
          <p className="mt-1 text-xs text-muted-foreground">Shared Museum Mode engine for Easy Mode and Expert Mode.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable Museum Mode</label>
      </div>

      {enabled && !advanced && <div className="flex flex-wrap gap-2">{easySteps.map((step) => <span key={step} className="rounded-full border border-white/10 bg-background/40 px-2 py-1 text-[10px] text-muted-foreground">{step}</span>)}</div>}

      {enabled && (
        <>
          <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <MuseumSpriteUploader selectedSprite={selected} onInsert={addSpriteAsset} onUpdate={updateSpriteAsset} compact />
                {selected && <Button variant="outline" onClick={() => updateSprite(selected.id, {}, true)}>Put on floor</Button>}
                {selected && <Button variant="outline" onClick={() => duplicateSprite(selected)}><Copy className="h-4 w-4" /> Duplicate</Button>}
                {selected && <Button variant="outline" onClick={() => updateSprite(selected.id, { locked: !selected.locked, editable: !!selected.locked })}>{selected.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{selected.locked ? "Unlock" : "Lock"}</Button>}
                {selected && <Button variant="outline" onClick={() => removeSprite(selected.id)}><Trash2 className="h-4 w-4" /> Delete</Button>}
              </div>

              {qaWarnings.length > 0 && <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">{qaWarnings.join(" · ")}</div>}

              <div ref={boardRef} onPointerMove={onPointerMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-background touch-none">
                {getRoomImage(room) ? <img src={getRoomImage(room)} alt="Room board" onLoad={(e) => analyzeImage(e.currentTarget)} className="h-full w-full object-cover opacity-80" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Upload a room image first</div>}
                {semanticLayout.safe_placement_zones?.map((zone, index) => <div key={index} className="pointer-events-none absolute border border-emerald-300/45 bg-emerald-300/10" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }} />)}
                <div className="pointer-events-none absolute left-0 right-0 border-t-2 border-cyan-300/80" style={{ top: `${baseline}%` }} />
                {sprites.filter((sprite) => sprite.visible !== false).map((sprite) => (
                  <div key={sprite.id} onPointerDown={(event) => { event.stopPropagation(); setSelectedId(sprite.id); if (!sprite.locked) { const point = pointerToPercent(event); setDrag({ type: "move", offsetX: point.x - Number(sprite.x || 0), offsetY: point.y - Number(sprite.y || 0) }); event.currentTarget.setPointerCapture?.(event.pointerId); } }} className={`absolute ${sprite.locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"} ${selected?.id === sprite.id ? "ring-2 ring-primary" : "ring-1 ring-white/20"}`} style={{ left: `${sprite.x}%`, top: `${sprite.y}%`, width: `${sprite.width}%`, height: `${sprite.height}%`, opacity: Number(sprite.opacity ?? 1), zIndex: 20 + Number(sprite.depth || sprite.z_index || 0), transform: `rotate(${Number(sprite.rotation || 0)}deg) scale(${Number(sprite.scale || 1)})` }}>
                    <SpriteMediaPreview sprite={sprite} className="h-full w-full select-none object-contain drop-shadow-2xl" />
                    {sprite.caption && <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-lg bg-background/85 px-2 py-1 text-[10px] text-foreground">{sprite.caption}</span>}
                    {selected?.id === sprite.id && !sprite.locked && <button type="button" onPointerDown={(event) => { event.stopPropagation(); setDrag({ type: "resize" }); }} className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border border-primary bg-background" aria-label="Resize artifact" />}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-white/10 bg-background/40 px-2 py-1"><ShieldCheck className="mr-1 inline h-3 w-3" /> {semanticLayout.floor_confidence_label || "Safe estimated floor"}</span>
                <span>Method: {semanticLayout.detection_method || "aspect_ratio_safe_floor_estimate"}</span>
                <span>Baseline: {Math.round(baseline)}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <MuseumCoCuratorPanel room={{ ...room, room_semantic_layout: semanticLayout }} selected={selected} />
              {advanced && (
                <div className="rounded-2xl border border-white/10 bg-background/35 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4" /> Artifact Layers</div>
                  <div className="space-y-1">{sprites.map((sprite) => <button key={sprite.id} onClick={() => setSelectedId(sprite.id)} className={`w-full rounded-lg px-2 py-1 text-left text-xs ${selected?.id === sprite.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"}`}>{sprite.title || "Artifact"}</button>)}</div>
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-background/35 p-3 md:grid-cols-4">
              <Input className="md:col-span-2" value={selected.title || ""} onChange={(e) => updateSprite(selected.id, { title: e.target.value })} placeholder="Title" />
              <Input value={selected.header || ""} onChange={(e) => updateSprite(selected.id, { header: e.target.value })} placeholder="Panel header" />
              <Input value={selected.caption || ""} onChange={(e) => updateSprite(selected.id, { caption: e.target.value })} placeholder="Caption" />
              <Textarea className="md:col-span-2" value={selected.description || ""} onChange={(e) => updateSprite(selected.id, { description: e.target.value })} placeholder="Short description" />
              <Textarea className="md:col-span-2" value={selected.body || ""} onChange={(e) => updateSprite(selected.id, { body: e.target.value })} placeholder="Story / curator note" />
              <Input value={selected.video_url || ""} onChange={(e) => updateSprite(selected.id, { video_url: e.target.value })} placeholder="Video URL" />
              <Input value={selected.audio_url || ""} onChange={(e) => updateSprite(selected.id, { audio_url: e.target.value })} placeholder="Audio URL" />

              {advanced && (
                <>
                  <label className="space-y-2"><Label>X</Label><Input type="number" value={Math.round(selected.x || 0)} onChange={(e) => updateSprite(selected.id, { x: Number(e.target.value) }, selected.floor_locked !== false)} /></label>
                  <label className="space-y-2"><Label>Y</Label><Input type="number" value={Math.round(selected.y || 0)} onChange={(e) => updateSprite(selected.id, { y: Number(e.target.value) })} /></label>
                  <label className="space-y-2"><Label>Width</Label><Input type="number" value={Math.round(selected.width || 0)} onChange={(e) => updateSprite(selected.id, { width: Number(e.target.value) }, selected.floor_locked !== false)} /></label>
                  <label className="space-y-2"><Label>Height</Label><Input type="number" value={Math.round(selected.height || 0)} onChange={(e) => updateSprite(selected.id, { height: Number(e.target.value) }, selected.floor_locked !== false)} /></label>
                  <label className="space-y-2"><Label>Rotation</Label><div className="flex gap-2"><Input type="number" value={selected.rotation || 0} onChange={(e) => updateSprite(selected.id, { rotation: Number(e.target.value) })} /><Button variant="outline" onClick={() => updateSprite(selected.id, { rotation: Number(selected.rotation || 0) + 15 })}><RotateCw className="h-4 w-4" /></Button></div></label>
                  <label className="space-y-2"><Label>Opacity</Label><Input type="number" min="0" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(e) => updateSprite(selected.id, { opacity: Number(e.target.value) })} /></label>
                  <label className="space-y-2"><Label>Depth / layer</Label><Input type="number" value={selected.depth || selected.z_index || 0} onChange={(e) => updateSprite(selected.id, { depth: Number(e.target.value), z_index: Number(e.target.value) })} /></label>
                  <label className="space-y-2"><Label>Display mode</Label><select value={selected.display_mode || "click"} onChange={(e) => updateSprite(selected.id, { display_mode: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="always">Always visible</option><option value="click">Click to open</option><option value="hover">Hover to open</option></select></label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.floor_locked !== false} onChange={(e) => updateSprite(selected.id, { floor_locked: e.target.checked }, e.target.checked)} /> Floor lock</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.shadow_enabled !== false} onChange={(e) => updateSprite(selected.id, { shadow_enabled: e.target.checked })} /> Shadow</label>
                  <label className="space-y-2"><Label>Manual floor baseline</Label><Input type="number" min="40" max="96" value={Math.round(baseline)} onChange={(e) => setSemanticLayout(applyManualFloorOverride(semanticLayout, Number(e.target.value)), true)} /></label>
                  <Button variant="outline" onClick={() => setSemanticLayout(applyManualFloorOverride(semanticLayout, baseline), true)}>Mark human verified</Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}