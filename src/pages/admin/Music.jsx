import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music as MusicIcon, Upload, Play, Pause, Trash2, Unplug, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["mp3", "mp4", "wav"];
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "video/mp4"];

const TARGET_OPTIONS = [
  {
    targetType: "Onboarding Overlay",
    targetKey: "home_onboarding_intro",
    targetLabel: "Homepage First-Time Onboarding",
    componentName: "HomepageOnboardingOverlay",
    route: "/",
    description: "Music played inside the first-time homepage onboarding and Replay Intro overlay.",
  },
  { targetType: "Page", targetKey: "platform_home", targetLabel: "Homepage", route: "/" },
  { targetType: "Page", targetKey: "platform_overview", targetLabel: "Platform Overview", route: "/platform/overview" },
  { targetType: "Global", targetKey: "global_platform", targetLabel: "Global Platform", route: "/" },
];

const PLACEMENTS = ["Background music", "Intro music", "Slide music", "CTA music", "Ambient loop"];

const blankForm = {
  title: "",
  description: "",
  fileUrl: "",
  enabled: true,
  targetType: "Onboarding Overlay",
  targetKey: "home_onboarding_intro",
  targetLabel: "Homepage First-Time Onboarding",
  placement: "Background music",
  autoplay: true,
  loop: true,
  volume: 0.7,
  fadeInMs: 1500,
  fadeOutMs: 1000,
  startAtSeconds: 0,
  endAtSeconds: "",
};

function validateMusicFile(file) {
  if (!file) return "Choose an MP3, MP4, or WAV file.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_TYPES.includes(file.type)) {
    return "Only MP3, MP4, or WAV files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) return "File must be 50MB or smaller.";
  return "";
}

export default function Music() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const [form, setForm] = useState(blankForm);
  const [file, setFile] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [error, setError] = useState("");
  const [previewingId, setPreviewingId] = useState(null);
  const [assetToDisconnect, setAssetToDisconnect] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const { data: assets = [] } = useQuery({
    queryKey: ["music-assets"],
    queryFn: () => base44.entities.MusicAsset.list("-updatedAt", 100),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      let fileData = editingAsset ? {
        fileUrl: form.fileUrl || editingAsset.fileUrl,
        fileType: editingAsset.fileType,
        fileName: editingAsset.fileName,
        fileSize: editingAsset.fileSize,
      } : {
        fileUrl: form.fileUrl,
        fileType: form.fileUrl ? "audio/url" : "",
        fileName: form.fileUrl ? "External audio URL" : "",
        fileSize: 0,
      };

      if (file) {
        const validation = validateMusicFile(file);
        if (validation) throw new Error(validation);
        const upload = await base44.integrations.Core.UploadFile({ file });
        fileData = {
          fileUrl: upload.file_url,
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
        };
      }

      if (!fileData.fileUrl) throw new Error("Upload a music file or enter an audio URL before saving.");

      const payload = {
        ...form,
        ...fileData,
        volume: Number(form.volume),
        fadeInMs: Number(form.fadeInMs || 0),
        fadeOutMs: Number(form.fadeOutMs || 0),
        startAtSeconds: Number(form.startAtSeconds || 0),
        endAtSeconds: form.endAtSeconds === "" ? null : Number(form.endAtSeconds),
        enabled: form.enabled !== false,
        status: form.enabled !== false ? "active" : "disconnected",
        updatedAt: now,
        createdAt: editingAsset?.createdAt || now,
      };

      if (editingAsset) return base44.entities.MusicAsset.update(editingAsset.id, payload);
      return base44.entities.MusicAsset.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-assets"] });
      setForm(blankForm);
      setFile(null);
      setEditingAsset(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MusicAsset.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["music-assets"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MusicAsset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["music-assets"] }),
  });

  const handleTargetChange = (targetKey) => {
    const target = TARGET_OPTIONS.find((item) => item.targetKey === targetKey);
    if (!target) return;
    setForm((prev) => ({ ...prev, targetKey, targetType: target.targetType, targetLabel: target.targetLabel }));
  };

  const startEdit = (asset) => {
    setEditingAsset(asset);
    setForm({ ...blankForm, ...asset, enabled: asset.enabled !== false && asset.status === "active", endAtSeconds: asset.endAtSeconds ?? "" });
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const preview = (asset) => {
    if (!previewRef.current) return;
    if (previewingId === asset.id) {
      previewRef.current.pause();
      setPreviewingId(null);
      return;
    }
    if (!asset.fileUrl) {
      setError(`"${asset.title}" has no audio file to preview.`);
      return;
    }
    setError("");
    previewRef.current.src = asset.fileUrl;
    previewRef.current.volume = Number(asset.volume ?? 0.7);
    previewRef.current.loop = !!asset.loop;
    const playPromise = previewRef.current.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        setError(`Could not play "${asset.title}". The audio source may be invalid or unsupported.`);
        setPreviewingId(null);
      });
    }
    setPreviewingId(asset.id);
  };

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MusicIcon className="h-3.5 w-3.5" /> Admin Panel
            </div>
            <h1 className="font-display text-4xl font-bold">Music</h1>
            <p className="mt-2 text-sm text-muted-foreground">Upload and connect music to pages, overlays, and platform moments.</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4" /> Upload Music
          </Button>
        </div>

        <Card className="border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle>{editingAsset ? "Edit Music Connection" : "Upload Music"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>File upload</Label>
                <Input ref={fileInputRef} type="file" accept=".mp3,.mp4,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,video/mp4" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2 lg:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Onboarding Audio</p>
                  <p className="mt-1 text-xs text-muted-foreground">Connect the homepage onboarding soundtrack used by the first-time intro and Replay Intro.</p>
                </div>
                <div className="mt-3 space-y-2">
                  <Label>Audio URL</Label>
                  <Input value={form.fileUrl || ""} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="Paste an MP3, WAV, MP4, or uploaded file URL" />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Target type</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
                  {["Page", "Pop-up Overlay", "Onboarding Overlay", "Card", "Global"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target destination</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.targetKey} onChange={(e) => handleTargetChange(e.target.value)}>
                  {TARGET_OPTIONS.map((item) => <option key={item.targetKey} value={item.targetKey}>{item.targetLabel}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Placement</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                  {PLACEMENTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Volume: {Math.round(Number(form.volume) * 100)}%</Label>
                <input className="w-full accent-primary" type="range" min="0" max="1" step="0.05" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
                <label className="flex items-center gap-2 rounded-md border border-white/10 p-3 text-sm"><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
                <label className="flex items-center gap-2 rounded-md border border-white/10 p-3 text-sm"><input type="checkbox" checked={form.autoplay !== false} onChange={(e) => setForm({ ...form, autoplay: e.target.checked })} /> Autoplay Enabled</label>
                <label className="flex items-center gap-2 rounded-md border border-white/10 p-3 text-sm"><input type="checkbox" checked={form.loop !== false} onChange={(e) => setForm({ ...form, loop: e.target.checked })} /> Loop</label>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                <div className="space-y-2"><Label>Fade in</Label><Input type="number" value={form.fadeInMs} onChange={(e) => setForm({ ...form, fadeInMs: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fade out</Label><Input type="number" value={form.fadeOutMs} onChange={(e) => setForm({ ...form, fadeOutMs: e.target.value })} /></div>
                <div className="space-y-2"><Label>Start time</Label><Input type="number" value={form.startAtSeconds} onChange={(e) => setForm({ ...form, startAtSeconds: e.target.value })} /></div>
                <div className="space-y-2"><Label>End time</Label><Input type="number" value={form.endAtSeconds} onChange={(e) => setForm({ ...form, endAtSeconds: e.target.value })} /></div>
              </div>
              {error && <p className="text-sm text-destructive lg:col-span-2">{error}</p>}
              <div className="flex gap-3 lg:col-span-2">
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
                {editingAsset && <Button type="button" variant="outline" onClick={() => { setEditingAsset(null); setForm(blankForm); setFile(null); }}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/70">
          <CardHeader><CardTitle>Music Assets</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <audio ref={previewRef} onEnded={() => setPreviewingId(null)} onError={() => { setError("The selected audio could not be loaded. The source may be invalid or unsupported."); setPreviewingId(null); }} />
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground"><tr><th className="py-3">Title</th><th>File Type</th><th>Connected To</th><th>Placement</th><th>Enabled</th><th>Autoplay</th><th>Loop</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-white/5">
                    <td className="py-3 font-medium">{asset.title}</td><td>{asset.fileType}</td><td>{asset.targetLabel}</td><td>{asset.placement}</td><td>{asset.enabled !== false && asset.status === "active" ? "Yes" : "No"}</td><td>{asset.autoplay !== false ? "Yes" : "No"}</td><td>{asset.loop !== false ? "Yes" : "No"}</td><td><Badge variant={asset.status === "active" ? "default" : "secondary"}>{asset.status}</Badge></td><td>{asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : "—"}</td>
                    <td><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => preview(asset)}>{previewingId === asset.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} Preview</Button><Button size="sm" variant="outline" onClick={() => startEdit(asset)}>Edit</Button><Button size="sm" variant="outline" onClick={() => startEdit(asset)}><RefreshCw className="h-3 w-3" /> Replace File</Button><Button size="sm" variant="outline" onClick={() => setAssetToDisconnect(asset)}><Unplug className="h-3 w-3" /> Disconnect</Button><Button size="sm" variant="destructive" onClick={() => setAssetToDelete(asset)}><Trash2 className="h-3 w-3" /> Delete</Button></div></td>
                  </tr>
                ))}
                {assets.length === 0 && <tr><td colSpan="10" className="py-8 text-center text-muted-foreground">No music uploaded yet.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!assetToDisconnect} onOpenChange={(o) => !o && setAssetToDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this music?</AlertDialogTitle>
            <AlertDialogDescription>
              "{assetToDisconnect?.title}" will be marked disconnected and stop playing where it's used. You can reconnect it later by editing it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { updateMutation.mutate({ id: assetToDisconnect.id, data: { status: "disconnected", enabled: false } }); setAssetToDisconnect(null); }}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!assetToDelete} onOpenChange={(o) => !o && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this music?</AlertDialogTitle>
            <AlertDialogDescription>
              "{assetToDelete?.title}" will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteMutation.mutate(assetToDelete.id); setAssetToDelete(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}