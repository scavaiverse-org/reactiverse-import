import { useEffect, useMemo, useState } from "react";
import { Eraser, ImageIcon, Loader2, RotateCcw, Scissors, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubjectCropCanvas from "./SubjectCropCanvas";
import SpriteEraserCanvas from "./SpriteEraserCanvas";
import { estimateInitialFocusCrop, loadImageToCanvas, processMuseumSprite } from "@/lib/sprite-image-processing";

export default function SpritePhotoshopPanel({ file, originalUrl, onAccept, onUseOriginal, onCancel }) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : originalUrl, [file, originalUrl]);
  const [status, setStatus] = useState("Finding the main subject…");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [processedUrl, setProcessedUrl] = useState("");
  const [processedBlob, setProcessedBlob] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [validation, setValidation] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [crop, setCrop] = useState(null);
  const [eraserActive, setEraserActive] = useState(false);

  useEffect(() => () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); }, [file, previewUrl]);

  const runProcess = async (cropOverride = null) => {
    if (!file && !originalUrl) return;
    setBusy(true);
    setError("");
    setStatus("Detecting the central subject…");
    try {
      const source = file || originalUrl;
      const loaded = await loadImageToCanvas(source);
      setImageSize({ width: loaded.width, height: loaded.height });
      const nextCrop = cropOverride || crop || null;
      setStatus("Removing background…");
      const result = await processMuseumSprite(source, { crop: nextCrop });
      setStatus("Cleaning subject edges…");
      const url = URL.createObjectURL(result.blob);
      setProcessedUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setProcessedBlob(result.blob);
      setMetadata(result.metadata);
      setValidation(result.validation);
      if (result.metadata?.crop) setCrop(result.metadata.crop);
      setStatus(result.validation?.passed ? "Ready to place in museum." : "Subject isolation needs manual refinement.");
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      const friendly = message.includes("tainted") || message.includes("cors")
        ? "This image cannot be edited because the file source blocks canvas processing. Re-upload the image or use original."
        : message.includes("load")
          ? "The image could not load for editing. Re-upload it or use original."
          : "We could not isolate the subject. Adjust the focus box or use the original image.";
      setError(friendly);
      setStatus("Subject isolation needs manual refinement.");
      setValidation({ passed: false, reasons: [friendly] });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { runProcess(null); }, [file, originalUrl]);
  useEffect(() => () => { if (processedUrl) URL.revokeObjectURL(processedUrl); }, [processedUrl]);

  const applyEraserBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    setProcessedUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    setProcessedBlob(blob);
    // Manual eraser keeps the sprite valid only if it was already validated; cleanup never fakes validation.
    setMetadata((current) => ({ ...(current || {}), edited_by_user: true, eraser_touchup_applied: true, updated_at: new Date().toISOString() }));
    setStatus(metadata?.validation_passed ? "Eraser touch-up applied." : "Eraser touch-up applied — re-check subject isolation.");
  };

  const canInsert = !busy && !!processedBlob && !!metadata?.validation_passed;

  return (
    <div className="rounded-2xl border border-primary/20 bg-background/70 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-lg font-bold">Sprite Photoshop</h4>
          <p className="text-xs text-muted-foreground">Upload your artifact image. The central subject is isolated and the background is removed.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>Close</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Original image — focus box guides detection</p>
          <SubjectCropCanvas sourceUrl={previewUrl} imageSize={imageSize} crop={crop} onCropChange={setCrop} onAutoCrop={() => runProcess(crop)} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Prepared sprite (transparent)</p>
          <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,.08)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,.08)_75%),linear-gradient(-45deg,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : processedUrl && eraserActive ? <SpriteEraserCanvas imageUrl={processedUrl} onChange={applyEraserBlob} /> : processedUrl ? <img src={processedUrl} alt="Prepared sprite" className="max-h-full max-w-full object-contain drop-shadow-2xl" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
          </div>
          <p className={`text-xs ${error || (validation && !validation.passed) ? "text-amber-200" : "text-emerald-300"}`}>{error || status}</p>
          {validation && !validation.passed && validation.reasons?.length > 0 && (
            <ul className="space-y-1 text-[11px] text-amber-200/80">{validation.reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>
          )}
        </div>
      </div>

      {metadata && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] leading-5 text-muted-foreground">
          <span className="text-foreground/80">{metadata.processing_method}</span>{"  "}
          alpha {Math.round((metadata.alpha_coverage || 0) * 100)}%{"  "}
          components {metadata.connected_components}{"  "}
          mask {metadata.mask_quality}{"  "}
          rect-risk {String(metadata.rectangle_risk)}{"  "}
          <span className={metadata.validation_passed ? "text-emerald-300" : "text-amber-300"}>validation {metadata.validation_passed ? "passed" : "failed"}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => runProcess(null)} disabled={busy}><Wand2 className="h-4 w-4" /> Auto Detect Subject</Button>
        <Button variant="outline" onClick={() => runProcess(crop)} disabled={busy || !crop}><Scissors className="h-4 w-4" /> Use My Focus Box</Button>
        <Button variant={eraserActive ? "default" : "outline"} onClick={() => setEraserActive((active) => !active)} disabled={busy || !processedUrl}><Eraser className="h-4 w-4" /> Eraser Touch Up</Button>
        <Button variant="outline" onClick={() => { if (!imageSize) return; const nextCrop = estimateInitialFocusCrop(imageSize.width, imageSize.height); setCrop(nextCrop); runProcess(nextCrop); }} disabled={busy || !imageSize}><RotateCcw className="h-4 w-4" /> Reset Focus</Button>
        <Button onClick={() => canInsert && onAccept?.({ blob: processedBlob, metadata })} disabled={!canInsert}>Insert Into Museum</Button>
        <Button variant="outline" onClick={onUseOriginal}>Use Original</Button>
      </div>
    </div>
  );
}