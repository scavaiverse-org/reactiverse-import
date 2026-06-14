import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Ticket, Trash2 } from 'lucide-react';
import { useActiveTenant } from '@/hooks/useActiveTenant';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  used: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  expired: 'bg-muted text-muted-foreground border-border',
  refunded: 'bg-muted text-muted-foreground border-border',
};

export default function AdminTickets() {
  const queryClient = useQueryClient();
  const { tenant } = useActiveTenant();
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets-all', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Ticket.filter({ tenant_id: tenant.id }, '-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ ticket, data }) => {
      if (!tenant?.id || ticket.tenant_id !== tenant.id) throw new Error('This ticket does not belong to the active tenant.');
      return base44.entities.Ticket.update(ticket.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-all', tenant?.id] });
      toast.success('Ticket updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticket) => {
      if (!tenant?.id || ticket.tenant_id !== tenant.id) throw new Error('This ticket does not belong to the active tenant.');
      return base44.entities.Ticket.delete(ticket.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-all', tenant?.id] });
      setTicketToDelete(null);
      toast.success('Ticket deleted');
    },
  });

  // Only count paid tickets toward revenue — 'pending' (unpaid reservations),
  // 'expired' and 'refunded' must be excluded. Paid = confirmed or used.
  const PAID_STATUSES = ['confirmed', 'used'];
  const totalRevenue = tickets
    .filter(t => PAID_STATUSES.includes(t.status))
    .reduce((sum, t) => sum + (t.total_price || 0), 0);
  const confirmed = tickets.filter(t => t.status === 'confirmed').length;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">TICKET MANAGEMENT</p>
          <h1 className="text-2xl font-display font-bold text-foreground">All Tickets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tickets.length} records</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-2xl font-display font-bold text-foreground">{tickets.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Tickets</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-2xl font-display font-bold text-emerald-400">{confirmed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Confirmed</p>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-2xl font-display font-bold text-primary">SGD {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Revenue</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-border/50">
              <TableHead className="text-xs text-muted-foreground">Visitor</TableHead>
              <TableHead className="text-xs text-muted-foreground">Type</TableHead>
              <TableHead className="text-xs text-muted-foreground">Qty</TableHead>
              <TableHead className="text-xs text-muted-foreground">Total</TableHead>
              <TableHead className="text-xs text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell></TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Ticket className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tickets yet</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Ticket records will appear here once visitors purchase</p>
                </TableCell>
              </TableRow>
            ) : tickets.map(ticket => (
              <TableRow key={ticket.id} className="border-border/30 hover:bg-secondary/20">
                <TableCell>
                  <div className="text-sm text-foreground font-medium">{ticket.visitor_name}</div>
                  <div className="text-xs text-muted-foreground">{ticket.visitor_email}</div>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">{ticket.ticket_type?.replace(/_/g, ' ')}</TableCell>
                <TableCell className="font-mono text-sm">{ticket.quantity || 1}</TableCell>
                <TableCell className="font-mono text-sm text-primary">SGD {ticket.total_price || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {ticket.created_date ? format(new Date(ticket.created_date), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize text-xs ${statusColors[ticket.status] || ''}`}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select value={ticket.status} onValueChange={(value) => updateMutation.mutate({ ticket, data: { status: value } })}>
                      <SelectTrigger className="h-7 w-28 text-xs bg-secondary border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['pending', 'confirmed', 'used', 'expired', 'refunded'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setTicketToDelete(ticket)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ticket for {ticketToDelete?.visitor_name || 'this visitor'} ({ticketToDelete?.visitor_email || 'no email'}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(ticketToDelete)}>
              Delete Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}