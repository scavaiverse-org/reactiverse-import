import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const LABELS = {
  media_url: "Main media",
  background_media_url: "Background media",
  foreground_media_url: "Foreground media",
  audio_url: "Audio",
  narrator_audio_url: "Narrator audio",
};

export default function MediaUploadStatus({ uploads = {} }) {
  const entries = Object.entries(uploads).filter(([, state]) => state?.status);
  if (!entries.length) return null;

  return (
    <div className="md:col-span-2 space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <p className="text-xs font-semibold text-primary">Upload status</p>
      {entries.map(([field, state]) => {
        const isUploading = state.status === "uploading";
        const isDone = state.status === "complete";
        const isError = state.status === "error";
        const Icon = isUploading ? Loader2 : isDone ? CheckCircle2 : AlertTriangle;
        return (
          <div key={field} className="rounded-xl border border-white/10 bg-background/45 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Icon className={`h-3.5 w-3.5 ${isUploading ? "animate-spin text-primary" : isDone ? "text-emerald-300" : "text-destructive"}`} />
                {LABELS[field] || field}
              </span>
              <span className={isError ? "text-destructive" : "text-muted-foreground"}>{state.message}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all duration-300 ${isError ? "bg-destructive" : isDone ? "bg-emerald-400" : "bg-primary"}`} style={{ width: `${state.progress || 0}%` }} />
            </div>
            {state.fileName && <p className="mt-1 truncate text-[10px] text-muted-foreground">{state.fileName}</p>}
          </div>
        );
      })}
    </div>
  );
}