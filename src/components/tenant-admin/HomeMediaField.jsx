import { AlertCircle, CheckCircle2, Cloud, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const stateMeta = {
  idle: { label: "Idle / no file selected", icon: Cloud, className: "text-muted-foreground" },
  uploading: { label: "Uploading...", icon: Loader2, className: "text-primary" },
  complete: { label: "Upload complete", icon: CheckCircle2, className: "text-emerald-300" },
  failed: { label: "Upload failed", icon: AlertCircle, className: "text-destructive" },
  saved: { label: "Saved to draft", icon: CheckCircle2, className: "text-sky-300" },
  published: { label: "Published live", icon: CheckCircle2, className: "text-primary" },
};

const shortUrl = (url = "") => url.length > 64 ? `${url.slice(0, 34)}…${url.slice(-18)}` : url;
const detectType = (url = "", explicitType = "") => explicitType || (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/i.test(url) ? "video" : url ? "image/link" : "none");

export default function HomeMediaField({ label, value, mediaType, status, onChange, onUpload, disabled = false }) {
  const meta = stateMeta[status?.state || (value ? "complete" : "idle")] || stateMeta.idle;
  const Icon = meta.icon;
  const type = detectType(value, mediaType || status?.mediaType);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value || ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="Image, video, YouTube/Vimeo, or direct media URL" />
        <Button asChild variant="outline" disabled={disabled || status?.state === "uploading"}>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => onUpload(e.target.files?.[0])} />
          </label>
        </Button>
      </div>
      <div className={`rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs ${meta.className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${status?.state === "uploading" ? "animate-spin" : ""}`} />
          <span className="font-semibold">{meta.label}</span>
          {status?.fileName && <span className="text-muted-foreground">· {status.fileName}</span>}
          <span className="text-muted-foreground">· {type}</span>
        </div>
        {status?.error ? <p className="mt-1 text-destructive">{status.error}</p> : value ? <p className="mt-1 text-muted-foreground">{shortUrl(value)} · file saved</p> : <p className="mt-1 text-muted-foreground">No media selected yet.</p>}
      </div>
    </div>
  );
}