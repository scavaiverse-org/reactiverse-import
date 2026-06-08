import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, PlusCircle, CheckCircle2, Clock, Archive, Star } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  draft: { color: "bg-yellow-500/10 text-yellow-400", icon: Clock },
  published: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  archived: { color: "bg-muted text-muted-foreground", icon: Archive },
};

export default function AdminExhibits({ exhibits = [] }) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", station_number: 1, category: "opera_tradition", description: "", narrative_text: "" });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Exhibit.create({ ...data, status: "draft" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-exhibits"] }); toast.success("Exhibit created"); setShowNew(false); setForm({ title: "", station_number: 1, category: "opera_tradition", description: "", narrative_text: "" }); },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Exhibit.update(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-exhibits"] }); toast.success("Exhibit updated"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{exhibits.filter(e => e.status === "published").length} published</span>
          <span>·</span>
          <span>{exhibits.filter(e => e.status === "draft").length} drafts</span>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground gap-1.5 text-xs h-8" onClick={() => setShowNew(!showNew)}>
          <PlusCircle className="w-3.5 h-3.5" /> New Exhibit
        </Button>
      </div>

      {showNew && (
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Create New Exhibit</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 bg-background h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Station #</Label>
                <Input type="number" value={form.station_number} onChange={e => setForm({ ...form, station_number: parseInt(e.target.value) })} className="mt-1 bg-background h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 bg-background h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["opera_tradition","costume_art","music_instruments","stage_design","cultural_heritage","interactive","commerce"].map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 bg-background text-sm" rows={2} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-primary h-8 text-xs" onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Exhibit"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {exhibits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Eye className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No exhibits yet. Create your first one above.</p></div>
      ) : (
        <div className="space-y-2">
          {exhibits.map(exhibit => {
            const cfg = statusConfig[exhibit.status] || statusConfig.draft;
            const Icon = cfg.icon;
            return (
              <Card key={exhibit.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{exhibit.station_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{exhibit.title}</p>
                      <Badge className={`text-[10px] ${cfg.color}`}><Icon className="w-2.5 h-2.5 mr-1" />{exhibit.status}</Badge>
                      {exhibit.is_featured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{exhibit.category?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex gap-2">
                    {exhibit.status === "draft" && (
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => publishMutation.mutate({ id: exhibit.id, status: "published" })}>Publish</Button>
                    )}
                    {exhibit.status === "published" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => publishMutation.mutate({ id: exhibit.id, status: "archived" })}>Archive</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}