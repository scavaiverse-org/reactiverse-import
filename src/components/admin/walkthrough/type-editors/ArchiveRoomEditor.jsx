import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";
import ScrollableImageControls from "../ScrollableImageControls";

const newDocument = () => ({ id: crypto.randomUUID(), title: "Document", description: "", category: "scan", file_url: "", media_url: "", media_type: "document" });

export default function ArchiveRoomEditor({ room, onChange }) {
  const config = room.archive_config || {};
  const documents = config.documents || [];
  const setConfig = (patch) => onChange({ ...room, archive_config: { ...config, ...patch } });
  const updateDocument = (index, patch) => setConfig({ documents: documents.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const upload = async (index, file) => {
    if (!file) return;
    try {
      const result = await uploadFile(file);
      updateDocument(index, { file_url: result.file_url, media_url: result.file_url, media_type: detectMediaTypeFromFile(file) });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Archive Room fields</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>Archive title</Label><Input value={config.archive_title || ""} onChange={(e) => setConfig({ archive_title: e.target.value })} /></label>
        <label className="space-y-2"><Label>Categories (comma separated)</Label><Input value={(config.categories || []).join(", ")} onChange={(e) => setConfig({ categories: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="poster, recording, photo, scan" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.searchable !== false} onChange={(e) => setConfig({ searchable: e.target.checked })} /> Searchable</label>
      </div>
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">Documents</p><Button size="sm" variant="outline" onClick={() => setConfig({ documents: [...documents, newDocument()] })}>Add document</Button></div>
      {documents.map((doc, index) => (
        <div key={doc.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-4">
          <Input value={doc.title || ""} placeholder="Title" onChange={(e) => updateDocument(index, { title: e.target.value })} />
          <Input value={doc.category || ""} placeholder="Category" onChange={(e) => updateDocument(index, { category: e.target.value })} />
          <select value={doc.media_type || "document"} onChange={(e) => updateDocument(index, { media_type: e.target.value })} className="rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="document">Document</option><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option></select>
          <Button variant="outline" onClick={() => setConfig({ documents: documents.filter((_, i) => i !== index) })}>Remove</Button>
          <div className="flex gap-2 md:col-span-4"><Input value={doc.file_url || ""} placeholder="File URL" onChange={(e) => updateDocument(index, { file_url: e.target.value, media_url: e.target.value, media_type: detectMediaTypeFromUrl(e.target.value, doc.media_type) })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf" onChange={(e) => upload(index, e.target.files?.[0])} /></label></Button></div>
          <div className="md:col-span-4"><ScrollableImageControls value={doc} mediaType={doc.media_type} onChange={(patch) => updateDocument(index, patch)} /></div>
        </div>
      ))}
    </section>
  );
}