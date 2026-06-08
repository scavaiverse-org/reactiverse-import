import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/admin/StatusBadge";

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground text-right break-all max-w-[60%]">{value}</span>
    </div>
  );
}

export default function ContentAssetDetailDialog({ asset, open, onClose }) {
  if (!asset) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#0d1626] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {asset.title}
            <StatusBadge status={asset.status} />
          </DialogTitle>
        </DialogHeader>

        {asset.url && (
          <div className="rounded-lg overflow-hidden border border-white/8 bg-white/[0.02]">
            <img src={asset.url} alt={asset.title} className="w-full h-44 object-cover" />
          </div>
        )}

        <div className="mt-2">
          <Row label="Type" value={asset.asset_type} />
          <Row label="Tenant" value={asset.tenant_name || asset.tenant_id} />
          <Row label="Version" value={asset.version ? `v${asset.version}` : null} />
          <Row label="Status" value={asset.status} />
          <Row label="File Size" value={asset.file_size} />
          <Row label="Tags" value={Array.isArray(asset.tags) ? asset.tags.join(", ") : null} />
          <Row label="Description" value={asset.description} />
        </div>
      </DialogContent>
    </Dialog>
  );
}