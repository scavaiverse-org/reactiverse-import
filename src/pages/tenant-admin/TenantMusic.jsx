import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Play, Pause, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveTenant } from "@/hooks/useActiveTenant";

const blankForm = {
  title: "",
  fileUrl: "",
  targetType: "Global",
  targetKey: "tenant_global",
  targetLabel: "Museum Experience",
  placement: "Ambient loop",
  autoplay: true,
  loop: true,
  volume: 0.5,
  enabled: true,
};

export default function TenantMusic() {
  const { tenant } = useActiveTenant();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const [form, setForm] = useState(blankForm);
  const [file, setFile] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);

  const { data: assets = [] } = useQuery({
    queryKey: ["tenant-music-assets", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.MusicAsset.filter({ tenant_id: tenant.id }, "-updatedAt", 100),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let fileData = { fileUrl: form.fileUrl, fileType: form.fileUrl ? "audio/url" : "", fileName: form.fileUrl ? "External audio URL" : "", fileSize: 0 };

      if (file) {
        const upload = await uploadFile(file);
        fileData = { fileUrl: upload.file_url, fileType: file.type, fileName: file.name, fileSize: file.size };
      }

      const now = new Date().toISOString();
      return base44.entities.MusicAsset.create({
        ...form,
        ...fileData,
        tenant_id: tenant.id,
        ownership_scope: "tenant",
        visibility: "private",
        targetKey: `${tenant.id}_${form.targetKey}`,
        targetLabel: `${tenant.name} · ${form.targetLabel}`,
        status: form.enabled !== false ? "active" : "disconnected",
        volume: Number(form.volume),
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-music-assets", tenant?.id] });
      setForm(blankForm);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (asset) => {
      if (!tenant?.id || asset.tenant_id !== tenant.id) throw new Error("This music asset does not belong to the active tenant.");
      return base44.entities.MusicAsset.delete(asset.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-music-assets", tenant?.id] }),
  });

  const preview = (asset) => {
    if (!previewRef.current) return;
    if (previewingId === asset.id) {
      previewRef.current.pause();
      setPreviewingId(null);
      return;
    }
    previewRef.current.src = asset.fileUrl;
    previewRef.current.volume = Number(asset.volume ?? 0.5);
    previewRef.current.loop = !!asset.loop;
    previewRef.current.play();
    setPreviewingId(asset.id);
  };

  if (!tenant) return <div className="text-sm text-muted-foreground">Select a tenant before managing music.</div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">TENANT MUSIC</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Music & Ambience</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage audio only for {tenant.name}.</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground"><Upload className="h-4 w-4" /> Upload</Button>
      </div>

      <Card className="border-border/50 bg-card/40">
        <CardHeader><CardTitle>Add Music</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>File upload</Label><Input ref={fileInputRef} type="file" accept=".mp3,.mp4,.wav,audio/*,video/mp4" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Audio URL</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="Paste an audio URL or upload a file" /></div>
            <div className="space-y-2"><Label>Placement</Label><Input value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} /></div>
            <div className="space-y-2"><Label>Volume: {Math.round(Number(form.volume) * 100)}%</Label><input className="w-full accent-primary" type="range" min="0" max="1" step="0.05" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} /></div>
            <Button type="submit" disabled={saveMutation.isPending || (!file && !form.fileUrl)}>{saveMutation.isPending ? "Saving..." : "Save Music"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/40">
        <CardHeader><CardTitle>Tenant Music Assets</CardTitle></CardHeader>
        <CardContent>
          <audio ref={previewRef} onEnded={() => setPreviewingId(null)} />
          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/25 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{asset.title}</p>
                  <p className="text-xs text-muted-foreground">{asset.targetLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={asset.status === "active" ? "default" : "secondary"}>{asset.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => preview(asset)}>{previewingId === asset.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} Preview</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(asset)}><Trash2 className="h-3 w-3" /> Delete</Button>
                </div>
              </div>
            ))}
            {assets.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No tenant music uploaded yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}