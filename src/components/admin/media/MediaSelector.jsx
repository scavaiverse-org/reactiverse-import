import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const getExtension = (value = "") => value.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase() || "";
const detectMediaType = (extension) => IMAGE_EXTENSIONS.includes(extension) ? "image" : VIDEO_EXTENSIONS.includes(extension) ? "video" : "";

export default function MediaSelector({ label, value, onChange, media = [], categories = [], onSaved, assignedSection, registryName = "MasterMediaRegistry", ownershipScope = "museum", tenant }) {
  const [sourceType, setSourceType] = useState("registry");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [presetName, setPresetName] = useState(label);
  const [description, setDescription] = useState("");
  const [categoryCode] = useState("AOM");
  const [error, setError] = useState("");
  const registry = base44.entities[registryName] || base44.entities.MasterMediaRegistry;
  const selected = media.find((item) => item.id === value);
  const activeMedia = media.filter((item) => (item.status === "active" || item.publishState === "published" || !item.status) && item.isActive !== false);
  const previewUrl = file ? URL.createObjectURL(file) : url || selected?.fileUrl;
  const extension = getExtension(file?.name || url || selected?.fileUrl || "");
  const mediaType = detectMediaType(extension) || selected?.mediaType || "image";
  const category = categories.find((item) => item.categoryCode === categoryCode) || categories.find((item) => item.categoryCode === "AOM");
  const duplicateName = useMemo(() => activeMedia.some((item) => slugify(item.presetName || item.name || "") === slugify(presetName || "")), [activeMedia, presetName]);

  const assignExistingMedia = async (next) => {
    if (next === "none") {
      onChange("");
      return;
    }
    const selectedItem = activeMedia.find((item) => item.id === next);
    if (selectedItem && assignedSection && !selectedItem.assignedSections?.includes(assignedSection)) {
      await registry.update(next, {
        assignedSections: [...(selectedItem.assignedSections || []), assignedSection],
        assignedPage: selectedItem.assignedPage || assignedSection?.split(".")[0],
        assignedComponent: selectedItem.assignedComponent || assignedSection,
        tags: Array.from(new Set([...(selectedItem.tags || []), ownershipScope, assignedSection].filter(Boolean))),
        updatedAt: new Date().toISOString(),
      });
      onSaved?.();
    }
    onChange(next);
  };

  const validate = () => {
    const nextExtension = getExtension(file?.name || url);
    const nextMediaType = detectMediaType(nextExtension);
    if (!presetName.trim()) return "Preset name is required.";
    if (!categoryCode) return "A museum category is required.";
    if (sourceType === "url" && !url.trim()) return "Media URL is required.";
    if (sourceType === "upload" && !file) return "Choose a file to upload.";
    if (!nextMediaType) return "Unsupported file type. Use JPG, PNG, WEBP, AVIF, GIF, SVG, MP4, WEBM, MOV, or M4V.";
    if (nextExtension === "svg") return "SVG must be trusted before saving.";
    if (nextExtension === "mov") return "MOV upload is allowed, but browser playback may fail. Use MP4 or WEBM when possible.";
    if (file && nextMediaType === "image" && file.size > 10 * 1024 * 1024) return "Image is larger than 10MB. Please compress it first.";
    if (file && nextMediaType === "video" && file.size > 100 * 1024 * 1024) return "Video is larger than 100MB. Please compress it first.";
    return "";
  };

  const savePreset = async () => {
    const validation = validate();
    setError(validation || (duplicateName ? "A preset with this name already exists. You can still save if this is intentional." : ""));
    if (validation) return;

    const uploaded = sourceType === "upload" ? await uploadFile(file) : null;
    const fileUrl = uploaded?.file_url || url.trim();
    const finalExtension = getExtension(file?.name || fileUrl);
    const finalMediaType = detectMediaType(finalExtension);
    const now = new Date().toISOString();
    const basePayload = {
      name: presetName.trim(),
      presetName: presetName.trim(),
      presetSlug: slugify(presetName),
      description,
      ownershipScope,
      assignedPage: assignedSection?.split(".")[0] || "unassigned",
      assignedComponent: assignedSection || "unassigned",
      renderType: "background",
      mediaType: finalMediaType,
      sourceType,
      fileUrl,
      thumbnailUrl: finalMediaType === "image" ? fileUrl : "",
      originalFileName: file?.name || fileUrl.split("/").pop(),
      fileExtension: finalExtension,
      mimeType: file?.type || "",
      fileSize: file?.size || 0,
      autoplay: true,
      loop: true,
      muted: true,
      isActive: true,
      publishState: "published",
      tags: [ownershipScope, assignedSection].filter(Boolean),
      createdAt: now,
      updatedAt: now,
    };
    const payload = registryName === "MasterMediaRegistry" ? {
      ...basePayload,
      museumCategory: categoryCode,
      museumCategoryCode: categoryCode,
      museumCategoryName: category?.categoryName || "Asian Operatic Museum",
      status: "active",
      assignedSections: assignedSection ? [assignedSection] : [],
      tags: [categoryCode, assignedSection].filter(Boolean),
    } : registryName === "MuseumMediaRegistry" ? {
      ...basePayload,
      tenantId: tenant?.id || tenant?.tenantId || "",
      museumId: tenant?.id || tenant?.museumId || "",
      tenantSlug: tenant?.slug || tenant?.tenantSlug || "",
    } : basePayload;

    const saved = await registry.create(payload);
    onChange(saved.id);
    onSaved?.();
    setSourceType("registry");
    setUrl("");
    setFile(null);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label className="text-sm text-foreground">{label}</Label>
          <p className="text-xs text-muted-foreground">{selected?.presetName || selected?.name || "No media assigned"}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-primary/80">{assignedSection || "No slot key"}</p>
        </div>
        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger className="h-11 bg-secondary sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="registry">Registry</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="url">External URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sourceType === "registry" && (
        <Select value={value || "none"} onValueChange={assignExistingMedia}>
          <SelectTrigger className="h-11 bg-secondary"><SelectValue placeholder="Choose existing preset" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No media</SelectItem>
            {activeMedia.map((item) => <SelectItem key={item.id} value={item.id}>{item.presetName || item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {sourceType !== "registry" && (
        <div className="grid gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            AOM · Asian Operatic Museum
          </div>
          <Input className="h-11 bg-secondary" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name" />
          <Textarea className="bg-secondary" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          {sourceType === "upload" ? <Input className="h-11 bg-secondary" type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(e) => setFile(e.target.files?.[0] || null)} /> : <Input className="h-11 bg-secondary" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste direct image or video URL" />}
          <Button type="button" onClick={savePreset} className="min-h-11 bg-primary text-primary-foreground">Save To Registry & Assign</Button>
        </div>
      )}

      {selected && (
        <div className="mt-3 grid gap-1 rounded-xl border border-border/40 bg-secondary/50 p-3 text-xs text-muted-foreground">
          <p><span className="text-foreground">Type:</span> {selected.mediaType}</p>
          <p><span className="text-foreground">Source:</span> {selected.sourceType}</p>
          <p><span className="text-foreground">Category:</span> {selected.museumCategoryCode || "AOM"}</p>
          <p><span className="text-foreground">Used by:</span> {(selected.assignedSections || []).join(", ") || "Unassigned"}</p>
          <p><span className="text-foreground">Status:</span> {selected.status === "active" && selected.isActive !== false ? "Active" : "Inactive"}</p>
        </div>
      )}

      {previewUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border/40 bg-black/20">
          {mediaType === "video" ? <video src={previewUrl} className="h-36 w-full object-cover" muted loop playsInline autoPlay /> : <img src={previewUrl} alt="Preview" className="h-36 w-full object-cover" />}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-amber-300">{error}</p>}
    </div>
  );
}