import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  pending: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  confirmed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  used: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: CheckCircle2 },
  expired: { color: "bg-muted text-muted-foreground", icon: XCircle },
  refunded: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: RefreshCw },
};

export default function AdminTickets({ tickets = [] }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Ticket.update(id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); toast.success("Ticket updated"); },
  });

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "used", "expired", "refunded"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {s} {s === "all" ? `(${tickets.length})` : `(${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Ticket className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No tickets found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => {
            const cfg = statusConfig[ticket.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <Card key={ticket.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground text-sm truncate">{ticket.visitor_name}</p>
                      <Badge className={`text-[10px] ${cfg.color} border`}>
                        <Icon className="w-2.5 h-2.5 mr-1" />{ticket.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ticket.visitor_email}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-muted-foreground capitalize">{ticket.ticket_type?.replace(/_/g, " ")}</span>
                      {ticket.total_price && <span className="text-xs text-primary font-medium">SGD {ticket.total_price}</span>}
                      {ticket.visit_date && <span className="text-xs text-muted-foreground">{ticket.visit_date}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {ticket.status === "pending" && (
                      <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateMutation.mutate({ id: ticket.id, status: "confirmed" })}>
                        Confirm
                      </Button>
                    )}
                    {ticket.status === "confirmed" && (
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => updateMutation.mutate({ id: ticket.id, status: "used" })}>
                        Mark Used
                      </Button>
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