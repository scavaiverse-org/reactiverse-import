import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import { Trash2 } from "lucide-react";

const pageOptions = [
  ["home", "Homepage"],
  ["walkthrough", "Museum Journey"],
  ["guide", "ARIA Guide"],
  ["tickets", "Museum Access"],
  ["vendors", "Marketplace"],
  ["commerce", "Products"],
  ["platform_overview", "Platform Overview"],
  ["platform_white_label", "Museum Deployment"],
  ["platform_analytics", "Impact Dashboard"],
  ["platform_docs", "Project Documentation"],
];

const emptyDraft = {
  page_key: "home",
  title: "",
  subtitle: "",
  body: "",
  cta_label: "",
  cta_path: "/walkthrough",
  secondary_cta_label: "",
  secondary_cta_path: "",
  status: "published",
  owner: "Museum Team",
  source: "Admin Public Content",
  public_visibility: true,
};

export default function PublicContent() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const { data: records = [] } = useQuery({ queryKey: ["admin-public-content"], queryFn: () => base44.entities.PublicContent.list("page_key") });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...draft, last_updated: new Date().toISOString() };
      if (draft.id) return base44.entities.PublicContent.update(draft.id, payload);
      return base44.entities.PublicContent.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-public-content"] });
      queryClient.invalidateQueries({ queryKey: ["public-content"] });
      setDraft(emptyDraft);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (record) => base44.entities.PublicContent.delete(record.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-public-content"] });
      queryClient.invalidateQueries({ queryKey: ["public-content"] });
      setRecordToDelete(null);
      setDraft(emptyDraft);
    },
  });

  const updateDraft = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <main className="min-h-screen bg-background p-6">
      <AdminBreadcrumb crumbs={[{ label: "Public Content" }]} />
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">Admin Public Content</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Public Page Content</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Edit the first screen visitors see on each public page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} role="button" tabIndex={0} onClick={() => setDraft(record)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDraft(record); } }} className="w-full rounded-xl border border-border/50 bg-card/40 p-4 text-left hover:border-primary/40 cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">{record.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary">{record.status}</span>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-destructive hover:text-destructive" onClick={(event) => { event.stopPropagation(); setRecordToDelete(record); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{pageOptions.find(([key]) => key === record.page_key)?.[1] || record.page_key}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{record.subtitle}</p>
            </div>
          ))}
        </div>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="space-y-4 p-5">
            <div>
              <Label>Page</Label>
              <Select value={draft.page_key} onValueChange={(value) => updateDraft("page_key", value)}>
                <SelectTrigger className="mt-1 bg-secondary border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{pageOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} /></div>
            <div><Label>Subtitle</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.subtitle} onChange={(e) => updateDraft("subtitle", e.target.value)} /></div>
            <div><Label>Body</Label><Textarea className="mt-1 bg-secondary border-border/50" rows={4} value={draft.body} onChange={(e) => updateDraft("body", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Main Button</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.cta_label} onChange={(e) => updateDraft("cta_label", e.target.value)} /></div>
              <div><Label>Main Route</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.cta_path} onChange={(e) => updateDraft("cta_path", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Second Button</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.secondary_cta_label || ""} onChange={(e) => updateDraft("secondary_cta_label", e.target.value)} /></div>
              <div><Label>Second Route</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.secondary_cta_path || ""} onChange={(e) => updateDraft("secondary_cta_path", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Owner</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.owner} onChange={(e) => updateDraft("owner", e.target.value)} /></div>
              <div><Label>Source</Label><Input className="mt-1 bg-secondary border-border/50" value={draft.source} onChange={(e) => updateDraft("source", e.target.value)} /></div>
            </div>
            <Button disabled={saveMutation.isPending || !draft.title || !draft.body} onClick={() => saveMutation.mutate()} className="w-full bg-primary text-primary-foreground">
              {saveMutation.isPending ? "Saving..." : "Save Public Content"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete content record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {recordToDelete?.title || 'this content record'}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(recordToDelete)}>
              Delete Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}