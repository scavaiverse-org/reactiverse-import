import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function SpriteEraserCanvas({ imageUrl, onChange }) {
  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const exportTimerRef = useRef(null);
  const imageRef = useRef(null);
  const [erasing, setErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(28);
  const [mode, setMode] = useState("erase");

  useEffect(() => () => clearTimeout(exportTimerRef.current), []);

  useEffect(() => {
    if (!imageUrl) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      imageRef.current = image;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = imageUrl;
  }, [imageUrl]);

  const pointFromEvent = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const xRatio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const yRatio = rect.height ? (event.clientY - rect.top) / rect.height : 0;
    return {
      x: Math.min(Math.max(xRatio, 0), 1) * canvas.width,
      y: Math.min(Math.max(yRatio, 0), 1) * canvas.height,
    };
  };

  const eraseAt = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const point = pointFromEvent(event);
    const previous = lastPointRef.current || point;
    ctx.save();
    if (mode === "restore" && imageRef.current) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize * 2;
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lastPointRef.current = point;
    queueExport();
  };

  const exportEdits = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => blob && onChange?.(blob), "image/png");
  };

  const queueExport = () => {
    clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(exportEdits, 40);
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="block min-h-0 w-full flex-1 cursor-crosshair touch-none rounded-xl"
        onPointerDown={(event) => {
          setErasing(true);
          lastPointRef.current = null;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          eraseAt(event);
        }}
        onPointerMove={(event) => erasing && eraseAt(event)}
        style={{ touchAction: "none" }}
        onPointerUp={() => { setErasing(false); lastPointRef.current = null; exportEdits(); }}
        onPointerCancel={() => { setErasing(false); lastPointRef.current = null; exportEdits(); }}
      />
      <div className="flex flex-wrap items-center gap-3 px-2 text-xs text-muted-foreground">
        <Button size="sm" variant={mode === "erase" ? "default" : "outline"} onClick={() => setMode("erase")}>Erase</Button>
        <Button size="sm" variant={mode === "restore" ? "default" : "outline"} onClick={() => setMode("restore")}>Restore</Button>
        <span>Brush size</span>
        <Slider value={[brushSize]} min={8} max={80} step={2} onValueChange={([value]) => setBrushSize(value)} />
      </div>
    </div>
  );
}