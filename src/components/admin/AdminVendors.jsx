import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  pending: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  approved: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
  active: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  suspended: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertCircle },
  rejected: { color: "bg-muted text-muted-foreground", icon: XCircle },
};

const slotColors = {
  standard: "bg-secondary text-muted-foreground",
  premium: "bg-primary/10 text-primary",
  featured: "bg-violet-500/10 text-violet-400",
  anchor: "bg-amber-500/10 text-amber-400",
};

export default function AdminVendors({ vendors = [], pendingVendors = [] }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Vendor.update(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-vendors"] }); toast.success("Vendor status updated"); },
  });

  const filtered = filter === "all" ? vendors : vendors.filter(v => v.status === filter);

  return (
    <div className="space-y-4">
      {pendingVendors.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">{pendingVendors.length} vendor application{pendingVendors.length > 1 ? "s" : ""} awaiting review</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "active", "suspended", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {s} ({s === "all" ? vendors.length : vendors.filter(v => v.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Store className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No vendors found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(vendor => {
            const cfg = statusConfig[vendor.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <Card key={vendor.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-primary">{vendor.business_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-foreground text-sm">{vendor.business_name}</p>
                      <Badge className={`text-[10px] ${cfg.color} border`}><Icon className="w-2.5 h-2.5 mr-1" />{vendor.status}</Badge>
                      <Badge className={`text-[10px] ${slotColors[vendor.slot_type] || slotColors.standard}`}>{vendor.slot_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{vendor.contact_name} · {vendor.email}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{vendor.category?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {vendor.status === "pending" && (
                      <>
                        <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateMutation.mutate({ id: vendor.id, status: "approved" })}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => updateMutation.mutate({ id: vendor.id, status: "rejected" })}>Reject</Button>
                      </>
                    )}
                    {vendor.status === "approved" && (
                      <Button size="sm" className="text-xs h-7 bg-primary"
                        onClick={() => updateMutation.mutate({ id: vendor.id, status: "active" })}>Activate</Button>
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