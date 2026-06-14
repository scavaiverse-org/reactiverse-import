import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';

const categories = ['opera_traditions','costume_design','musical_instruments','stage_craft','cultural_heritage','digital_interactive','ar_experience','historical_archive'];

export default function AdminExhibits() {
  const queryClient = useQueryClient();
  const { tenant } = useActiveTenant();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exhibitToDelete, setExhibitToDelete] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', description: '', category: '', station_number: '', is_featured: false, status: 'draft' });

  const { data: exhibits = [], isLoading } = useQuery({
    queryKey: ['tenant-admin-exhibits', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Exhibit.filter({ tenant_id: tenant.id }, 'station_number', 100),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Exhibit.create({ ...data, tenant_id: tenant.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin-exhibits', tenant?.id] });
      toast.success('Exhibit created');
      setDialogOpen(false);
      setForm({ title: '', subtitle: '', description: '', category: '', station_number: '', is_featured: false, status: 'draft' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ exhibit, data }) => {
      if (!tenant?.id || exhibit.tenant_id !== tenant.id) throw new Error('This exhibit does not belong to the active tenant.');
      return base44.entities.Exhibit.update(exhibit.id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-admin-exhibits', tenant?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (exhibit) => {
      if (!tenant?.id || exhibit.tenant_id !== tenant.id) throw new Error('This exhibit does not belong to the active tenant.');
      return base44.entities.Exhibit.delete(exhibit.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin-exhibits', tenant?.id] });
      setExhibitToDelete(null);
      toast.success('Exhibit deleted');
    },
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Exhibit Management</h1>
          <p className="text-muted-foreground font-body text-sm">{exhibits.length} exhibits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-body gap-2">
              <Plus className="w-4 h-4" /> Add Exhibit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">New Exhibit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-body text-sm">Title</Label>
                <Input value={form.title} onChange={e => update('title', e.target.value)} className="mt-1 bg-background" />
              </div>
              <div>
                <Label className="font-body text-sm">Subtitle</Label>
                <Input value={form.subtitle} onChange={e => update('subtitle', e.target.value)} className="mt-1 bg-background" />
              </div>
              <div>
                <Label className="font-body text-sm">Description</Label>
                <Textarea value={form.description} onChange={e => update('description', e.target.value)} className="mt-1 bg-background" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-sm">Category</Label>
                  <Select value={form.category} onValueChange={v => update('category', v)}>
                    <SelectTrigger className="mt-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-body text-sm">Station #</Label>
                  <Input type="number" value={form.station_number} onChange={e => update('station_number', e.target.value ? parseInt(e.target.value, 10) : null)} className="mt-1 bg-background" />
                </div>
              </div>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title} className="w-full bg-primary text-primary-foreground font-body">
                Create Exhibit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exhibits.map(exhibit => (
          <div key={exhibit.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">Station {exhibit.station_number || '-'}</span>
            </div>
            <h3 className="font-body font-semibold text-foreground text-sm mb-1">{exhibit.title}</h3>
            <p className="text-muted-foreground text-xs font-body line-clamp-2 mb-4">{exhibit.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body capitalize text-muted-foreground">{exhibit.category?.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-body">Published</span>
                <Switch
                  checked={exhibit.status === 'published'}
                  onCheckedChange={(checked) => toggleMutation.mutate({ exhibit, data: { status: checked ? 'published' : 'draft' } })}
                />
                <Button size="sm" variant="outline" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => setExhibitToDelete(exhibit)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && exhibits.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground font-body text-sm">
            No exhibits yet. Create your first exhibit above.
          </div>
        )}
      </div>

      <AlertDialog open={!!exhibitToDelete} onOpenChange={(open) => !open && setExhibitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exhibit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {exhibitToDelete?.title || 'this exhibit'}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(exhibitToDelete)}>
              Delete Exhibit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}