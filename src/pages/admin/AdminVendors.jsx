import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Store, CheckCircle2, Trash2 } from 'lucide-react';
import { useActiveTenant } from '@/hooks/useActiveTenant';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  rejected: 'bg-muted text-muted-foreground border-border',
};

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const { tenant } = useActiveTenant();
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['admin-vendors-all', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Vendor.filter({ tenant_id: tenant.id }, '-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ vendor, data }) => {
      if (!tenant?.id || vendor.tenant_id !== tenant.id) throw new Error('This vendor does not belong to the active tenant.');
      return base44.entities.Vendor.update(vendor.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors-all', tenant?.id] });
      toast.success('Vendor updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vendor) => {
      if (!tenant?.id || vendor.tenant_id !== tenant.id) throw new Error('This vendor does not belong to the active tenant.');
      return base44.entities.Vendor.delete(vendor.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors-all', tenant?.id] });
      setVendorToDelete(null);
      toast.success('Vendor deleted');
    },
  });

  const pending = vendors.filter(v => v.status === 'pending').length;
  const active = vendors.filter(v => v.status === 'active').length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">VENDOR MANAGEMENT</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Vendor Registry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{vendors.length} total applications</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border/50 bg-card/30">
          <p className="text-2xl font-display font-bold text-foreground">{vendors.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Vendors</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <p className="text-2xl font-display font-bold text-amber-400">{pending}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending Review</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-2xl font-display font-bold text-emerald-400">{active}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active Partners</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-border/50">
              <TableHead className="text-xs text-muted-foreground">Business</TableHead>
              <TableHead className="text-xs text-muted-foreground">Contact</TableHead>
              <TableHead className="text-xs text-muted-foreground">Category</TableHead>
              <TableHead className="text-xs text-muted-foreground">Slot</TableHead>
              <TableHead className="text-xs text-muted-foreground">Applied</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell></TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Store className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No vendor applications yet</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Vendors appear here after submitting an application</p>
                </TableCell>
              </TableRow>
            ) : vendors.map(vendor => (
              <TableRow key={vendor.id} className="border-border/30 hover:bg-secondary/20">
                <TableCell>
                  <div className="text-sm text-foreground font-medium">{vendor.business_name}</div>
                  <div className="text-xs text-muted-foreground">{vendor.email}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{vendor.contact_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground capitalize">{vendor.category?.replace(/_/g, ' ')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">{vendor.slot_type || 'standard'}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {vendor.created_date ? format(new Date(vendor.created_date), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize text-xs ${statusColors[vendor.status] || ''}`}>
                    {vendor.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {vendor.status === 'pending' && (
                      <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        onClick={() => updateMutation.mutate({ vendor, data: { status: 'approved' } })}>
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </Button>
                    )}
                    <Select value={vendor.status} onValueChange={(value) => updateMutation.mutate({ vendor, data: { status: value } })}>
                      <SelectTrigger className="h-7 w-28 text-xs bg-secondary border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['pending', 'approved', 'active', 'suspended', 'rejected'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setVendorToDelete(vendor)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {vendorToDelete?.business_name || 'this vendor'} and its application record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(vendorToDelete)}>
              Delete Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}