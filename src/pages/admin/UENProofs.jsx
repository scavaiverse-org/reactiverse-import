import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Ticket, Rocket, CheckCircle2, XCircle, Clock, ExternalLink, ImageOff, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getPaymentProofSignedUrl } from "@/lib/upload";
import { PAYNOW } from "@/lib/presale-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_FILTERS = ["all", "pending", "verified", "rejected"];

const statusStyles = {
  pending: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  verified: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  rejected: "text-rose-300 bg-rose-500/15 border-rose-500/30",
};

function StatCard({ title, value, icon: Icon, tone = "text-primary" }) {
  return (
    <Card className="bg-card/70 border-white/10">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-6 h-6 ${tone}`} />
      </CardContent>
    </Card>
  );
}

// Loads a short-lived signed URL for a private proof screenshot (admins only).
function ProofThumb({ path }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(!!path);
  useEffect(() => {
    let active = true;
    if (!path) { setLoading(false); return undefined; }
    setLoading(true);
    getPaymentProofSignedUrl(path).then((signed) => { if (active) { setUrl(signed); setLoading(false); } });
    return () => { active = false; };
  }, [path]);

  if (!path) return <div className="flex h-24 w-full items-center justify-center rounded-lg border border-white/10 bg-background/40 text-[10px] text-muted-foreground"><ImageOff className="mr-1 h-3.5 w-3.5" /> No screenshot</div>;
  if (loading) return <div className="flex h-24 w-full items-center justify-center rounded-lg border border-white/10 bg-background/40"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (!url) return <div className="flex h-24 w-full items-center justify-center rounded-lg border border-white/10 bg-background/40 text-[10px] text-rose-300">Couldn't load image</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group relative block">
      <img src={url} alt="Payment proof" className="h-24 w-full rounded-lg border border-white/10 object-cover" />
      <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition group-hover:opacity-100"><ExternalLink className="h-3 w-3" /> Open</span>
    </a>
  );
}

export default function UENProofs() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const { data: proofs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["payment-proofs"],
    queryFn: () => base44.entities.PaymentProof.list("-created_at", 500),
    initialData: [],
  });

  const stats = useMemo(() => ({
    total: proofs.length,
    pending: proofs.filter((p) => p.status === "pending").length,
    verified: proofs.filter((p) => p.status === "verified").length,
    tickets: proofs.filter((p) => p.kind === "ticket").length,
  }), [proofs]);

  const visible = useMemo(
    () => (filter === "all" ? proofs : proofs.filter((p) => p.status === filter)),
    [proofs, filter]
  );

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await base44.entities.PaymentProof.update(id, { status, reviewed_at: new Date().toISOString() });
      await queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Receipt className="h-6 w-6 text-primary" /> UEN — Payment Proofs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pre-sale PayNow submissions to UEN <span className="font-mono text-foreground">{PAYNOW.uen}</span>. Verify each transfer, then grant the e-ticket / tenant role manually.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total submissions" value={stats.total} icon={Receipt} />
        <StatCard title="Pending review" value={stats.pending} icon={Clock} tone="text-amber-400" />
        <StatCard title="Verified" value={stats.verified} icon={CheckCircle2} tone="text-emerald-400" />
        <StatCard title="E-ticket orders" value={stats.tickets} icon={Ticket} tone="text-primary" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((entry) => (
          <Button key={entry} size="sm" variant={filter === entry ? "default" : "outline"} onClick={() => setFilter(entry)} className="capitalize">
            {entry}{entry !== "all" ? ` (${proofs.filter((p) => p.status === entry).length})` : ""}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading submissions…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card/50 p-10 text-center text-sm text-muted-foreground">No submissions{filter !== "all" ? ` with status "${filter}"` : " yet"}.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((proof) => (
            <Card key={proof.id} className="bg-card/70 border-white/10">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${proof.kind === "ticket" ? "border-primary/30 bg-primary/10 text-primary" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"}`}>
                    {proof.kind === "ticket" ? <Ticket className="h-3 w-3" /> : <Rocket className="h-3 w-3" />}
                    {proof.kind === "ticket" ? "E-Ticket" : "Tenant Trial"}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[proof.status] || statusStyles.pending}`}>{proof.status}</span>
                </div>

                <ProofThumb path={proof.screenshotPath} />

                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{proof.itemLabel || proof.itemId}</p>
                  <p className="text-muted-foreground">{proof.email}</p>
                  {proof.organization && <p className="text-xs text-muted-foreground">{proof.organization}{proof.contactName ? ` · ${proof.contactName}` : ""}</p>}
                  <p className="text-xs">
                    <span className="font-bold text-primary">{proof.amount ? `${proof.currency} ${proof.amount}` : "Free"}</span>
                    {proof.quantity > 1 ? <span className="text-muted-foreground"> · qty {proof.quantity}</span> : null}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{proof.createdAt ? new Date(proof.createdAt).toLocaleString() : ""}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10" disabled={busyId === proof.id || proof.status === "verified"} onClick={() => setStatus(proof.id, "verified")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-rose-500/30 text-rose-300 hover:bg-rose-500/10" disabled={busyId === proof.id || proof.status === "rejected"} onClick={() => setStatus(proof.id, "rejected")}>
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
