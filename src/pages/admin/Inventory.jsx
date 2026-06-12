import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Archive, Boxes, Plus, Ticket, Trash2, Users } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const EMPTY_TEMPLATE = {
  package_type: "",
  name: "",
  description: "",
  design_version: "v1",
  price: "",
  currency: "SGD",
  benefits: "",
  is_active: true,
};

const INVENTORY_STATUSES = ["active", "used", "expired", "revoked"];

const KNOWN_PACKAGE_TYPES = "standard_pass, premium_pass, family_pass, school_block_40, school_block_100, corporate_block_50, event_vip_tour";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [activeTenant, setActiveTenant] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TEMPLATE);

  const { data: tenants = [] } = useQuery({ queryKey: ["inv-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["inv-templates", selected?.id],
    queryFn: () => selected ? base44.entities.ETicketTemplate.filter({ tenant_id: selected.id }) : base44.entities.ETicketTemplate.list(),
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["inv-items"],
    queryFn: () => base44.entities.InventoryItem.list("-issued_at", 200),
  });

  const { data: profiles = [] } = useQuery({ queryKey: ["inv-profiles"], queryFn: () => base44.entities.Profile.list("email", 500) });

  const profileById = useMemo(() => {
    const map = new Map();
    profiles.forEach(p => map.set(p.id, p));
    return map;
  }, [profiles]);

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        package_type: data.package_type,
        name: data.name,
        description: data.description,
        design_version: data.design_version,
        price: data.price === "" ? null : Number(data.price),
        currency: data.currency || "SGD",
        benefits: String(data.benefits || "").split("\n").map(s => s.trim()).filter(Boolean),
        is_active: !!data.is_active,
      };
      if (data.id) return base44.entities.ETicketTemplate.update(data.id, payload);
      return base44.entities.ETicketTemplate.create({ ...payload, tenant_id: selected?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inv-templates", selected?.id] });
      setEditingTemplate(null);
      toast.success("E-ticket template saved");
    },
    onError: (error) => toast.error(error.message || "Failed to save template"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (template) => base44.entities.ETicketTemplate.update(template.id, { is_active: !(template.is_active !== false) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inv-templates", selected?.id] }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (template) => base44.entities.ETicketTemplate.delete(template.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inv-templates", selected?.id] });
      setTemplateToDelete(null);
      toast.success("Template deleted");
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: ({ item, status }) => base44.entities.InventoryItem.update(item.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inv-items"] });
      toast.success("Inventory item updated");
    },
  });

  const openNewTemplate = () => {
    setDraft({ ...EMPTY_TEMPLATE });
    setEditingTemplate({});
  };

  const openEditTemplate = (template) => {
    setDraft({
      id: template.id,
      package_type: template.package_type || "",
      name: template.name || "",
      description: template.description || "",
      design_version: template.design_version || "v1",
      price: template.price ?? "",
      currency: template.currency || "SGD",
      benefits: (template.benefits || []).join("\n"),
      is_active: template.is_active !== false,
    });
    setEditingTemplate(template);
  };

  const activeTemplates = templates.filter(t => t.is_active !== false).length;
  const activeItems = items.filter(i => i.status === "active").length;
  const usedItems = items.filter(i => i.status === "used").length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Inventory" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-blue-400 font-semibold mb-1">E-TICKET INVENTORY</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage e-ticket template versions per package, and review every e-ticket issued to platform users.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{templates.length}</p>
          <p className="text-xs text-muted-foreground">Template Versions</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{activeTemplates}</p>
          <p className="text-xs text-muted-foreground">Active Templates</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-blue-400">{items.length}</p>
          <p className="text-xs text-muted-foreground">E-Tickets Issued</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{activeItems} / {usedItems}</p>
          <p className="text-xs text-muted-foreground">Active / Used</p>
        </div>
      </div>

      {/* E-Ticket Catalog */}
      <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-blue-400" />E-Ticket Catalog{selected ? ` — ${selected.name}` : ""}
          </p>
          <Button size="sm" onClick={openNewTemplate} disabled={!selected}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Version
          </Button>
        </div>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border/50">
                <TableHead className="text-xs text-muted-foreground">Package</TableHead>
                <TableHead className="text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground">Version</TableHead>
                <TableHead className="text-xs text-muted-foreground">Price</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTemplates ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell></TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Archive className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No e-ticket templates yet</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Create a version for each ticket package above</p>
                  </TableCell>
                </TableRow>
              ) : templates.map(template => (
                <TableRow key={template.id} className="border-border/30 hover:bg-secondary/20">
                  <TableCell className="text-sm capitalize text-foreground">{template.package_type?.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{template.name}</div>
                    {template.description && <div className="text-[10px] text-muted-foreground max-w-xs truncate">{template.description}</div>}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{template.design_version}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">{template.currency} {template.price ?? "—"}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggleActiveMutation.mutate(template)}>
                      <StatusBadge status={template.is_active !== false ? "enabled" : "disabled"} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openEditTemplate(template)}>Edit</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setTemplateToDelete(template)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* User Inventory */}
      <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-blue-400" />User Inventory
          <span className="text-[10px] text-muted-foreground">({items.length} e-tickets across all tenants)</span>
        </p>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border/50">
                <TableHead className="text-xs text-muted-foreground">User</TableHead>
                <TableHead className="text-xs text-muted-foreground">E-Ticket Code</TableHead>
                <TableHead className="text-xs text-muted-foreground">Package</TableHead>
                <TableHead className="text-xs text-muted-foreground">Museum</TableHead>
                <TableHead className="text-xs text-muted-foreground">Issued</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingItems ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Boxes className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No e-tickets issued yet</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">E-tickets are credited automatically after a successful purchase</p>
                  </TableCell>
                </TableRow>
              ) : items.map(item => {
                const profile = profileById.get(item.user_id);
                return (
                  <TableRow key={item.id} className="border-border/30 hover:bg-secondary/20">
                    <TableCell>
                      <div className="text-sm text-foreground font-medium">{profile?.full_name || item.visitor_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || item.visitor_email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">{item.e_ticket_code}</TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">{(item.label || item.package_type)?.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.tenant_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.issued_at ? format(new Date(item.issued_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <Select value={item.status} onValueChange={(value) => updateItemStatusMutation.mutate({ item, status: value })}>
                        <SelectTrigger className="h-7 w-24 text-xs bg-secondary border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit E-Ticket Template" : "New E-Ticket Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Package Type *</label>
                <Input value={draft.package_type} onChange={e => setDraft({ ...draft, package_type: e.target.value })} placeholder="e.g. standard_pass" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Design Version *</label>
                <Input value={draft.design_version} onChange={e => setDraft({ ...draft, design_version: e.target.value })} placeholder="v1" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-2">Package type should match a Ticketing config id for automatic crediting: {KNOWN_PACKAGE_TYPES}</p>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Name *</label>
              <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Standard Pass E-Ticket" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Description</label>
              <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Price</label>
                <Input type="number" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="12" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Currency</label>
                <Input value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} placeholder="SGD" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Benefits (one per line)</label>
              <Textarea value={draft.benefits} onChange={e => setDraft({ ...draft, benefits: e.target.value })} rows={4} placeholder={"Full walkthrough access\n48-hour access window"} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
              <label className="text-xs text-foreground">Active</label>
              <Switch checked={draft.is_active} onCheckedChange={(checked) => setDraft({ ...draft, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button
              disabled={!draft.package_type || !draft.name || !draft.design_version || saveTemplateMutation.isPending}
              onClick={() => saveTemplateMutation.mutate(draft)}
            >
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete e-ticket template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{templateToDelete?.name}" template ({templateToDelete?.design_version}). E-tickets already issued from this template are not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTemplateMutation.mutate(templateToDelete)}>
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
