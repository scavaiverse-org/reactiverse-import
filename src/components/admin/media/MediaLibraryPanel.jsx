import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MediaLibraryPanel({ media = [], categories = [], onChanged }) {
  const [category, setCategory] = useState("AOM");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = media.filter((item) => {
    const categoryMatch = category === "all" || item.museumCategoryCode === category || item.museumCategory === category;
    const typeMatch = type === "all" || item.mediaType === type;
    const searchMatch = !search || `${item.presetName || item.name} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && typeMatch && searchMatch;
  });

  const updateStatus = async (item, status) => {
    await base44.entities.MasterMediaRegistry.update(item.id, {
      status,
      isActive: status === "active",
      updatedAt: new Date().toISOString(),
    });
    onChanged?.();
  };

  const duplicatePreset = async (item) => {
    const now = new Date().toISOString();
    const copy = { ...item, name: `${item.name || item.presetName} Copy`, presetName: `${item.presetName || item.name} Copy`, presetSlug: `${item.presetSlug || item.id}-copy-${Date.now()}`, status: "draft", isActive: false, createdAt: now, updatedAt: now };
    delete copy.id;
    delete copy.created_date;
    delete copy.updated_date;
    await base44.entities.MasterMediaRegistry.create(copy);
    onChanged?.();
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">AOM Preset Library</p>
        <p className="text-xs text-muted-foreground">View, filter, preview, duplicate, archive, or restore media presets.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Museums</SelectItem>
            {categories.map((cat) => <SelectItem key={cat.id} value={cat.categoryCode}>{cat.categoryName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Images & Videos</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        <Input className="h-11 bg-secondary" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search presets" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-xl border border-border/40 bg-black/15 p-3">
            <div className="overflow-hidden rounded-lg bg-black/30">
              {item.mediaType === "video" ? <video src={item.fileUrl} className="h-28 w-full object-cover" muted loop playsInline /> : <img src={item.thumbnailUrl || item.fileUrl} alt={item.presetName || item.name} className="h-28 w-full object-cover" />}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.presetName || item.name}</p>
                <p className="text-xs text-muted-foreground">{item.museumCategoryCode || item.museumCategory} · {item.mediaType} · {item.status}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open(item.fileUrl, "_blank")}>Preview</Button>
              <Button size="sm" variant="outline" onClick={() => duplicatePreset(item)}>Duplicate</Button>
              {item.status === "archived" ? <Button size="sm" onClick={() => updateStatus(item, "active")}>Restore</Button> : <Button size="sm" variant="outline" onClick={() => updateStatus(item, "archived")}>Archive</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}