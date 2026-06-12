import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Download, Mail, Search } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SOURCE_LABELS = {
  user: "Registered User",
  ticket: "Ticket Buyer",
  inquiry: "Tenant Inquiry",
};

const SOURCE_COLORS = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ticket: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inquiry: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function downloadCsv(rows) {
  const header = ["Email", "Name", "Sources", "Details"];
  const lines = [header, ...rows.map(r => [
    r.email,
    r.name || "",
    [...r.sources].map(s => SOURCE_LABELS[s] || s).join("; "),
    [...r.details].join("; "),
  ])];
  const csv = lines.map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `scaverse-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: profiles = [] } = useQuery({ queryKey: ["contacts-profiles"], queryFn: () => base44.entities.Profile.list("email", 500) });
  const { data: tickets = [] } = useQuery({ queryKey: ["contacts-tickets"], queryFn: () => base44.entities.Ticket.list("-created_at", 500) });
  const { data: inquiries = [] } = useQuery({ queryKey: ["contacts-inquiries"], queryFn: () => base44.entities.TenantInquiry.list("-created_at", 200) });

  const contacts = useMemo(() => {
    const map = new Map();
    const upsert = (email, { name, source, detail, date }) => {
      if (!email || !email.includes("@")) return;
      const key = email.trim().toLowerCase();
      const existing = map.get(key) || { email: email.trim(), name: "", sources: new Set(), details: new Set(), latest: null };
      if (!existing.name && name) existing.name = name;
      existing.sources.add(source);
      if (detail) existing.details.add(detail);
      if (date && (!existing.latest || new Date(date) > new Date(existing.latest))) existing.latest = date;
      map.set(key, existing);
    };

    profiles.forEach(p => upsert(p.email, { name: p.full_name, source: "user", detail: p.role ? `role: ${p.role}` : "", date: p.created_at }));
    tickets.forEach(t => upsert(t.visitor_email, { name: t.visitor_name, source: "ticket", detail: t.tenant_name ? `${t.tenant_name} — ${(t.ticket_type || "").replace(/_/g, " ")}` : (t.ticket_type || "").replace(/_/g, " "), date: t.created_at }));
    inquiries.forEach(i => upsert(i.email, { name: i.contact_name, source: "inquiry", detail: i.organization || "", date: i.submitted_at || i.created_at }));

    return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [profiles, tickets, inquiries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter(c => {
      if (sourceFilter !== "all" && !c.sources.has(sourceFilter)) return false;
      if (!q) return true;
      return c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    });
  }, [contacts, search, sourceFilter]);

  const userCount = contacts.filter(c => c.sources.has("user")).length;
  const ticketCount = contacts.filter(c => c.sources.has("ticket")).length;
  const inquiryCount = contacts.filter(c => c.sources.has("inquiry")).length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Contacts" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-blue-400 font-semibold mb-1">EMAIL DIRECTORY</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Every email captured by the platform — registered users, ticket buyers, and tenant inquiries — in one place.</p>
        </div>
        <Button size="sm" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>
          <Download className="w-3.5 h-3.5 mr-1" />Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{contacts.length}</p>
          <p className="text-xs text-muted-foreground">Unique Emails</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-blue-400">{userCount}</p>
          <p className="text-xs text-muted-foreground">Registered Users</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{ticketCount}</p>
          <p className="text-xs text-muted-foreground">Ticket Buyers</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{inquiryCount}</p>
          <p className="text-xs text-muted-foreground">Tenant Inquiries</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name" className="pl-8" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-48 text-xs bg-secondary border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Sources</SelectItem>
            <SelectItem value="user" className="text-xs">Registered Users</SelectItem>
            <SelectItem value="ticket" className="text-xs">Ticket Buyers</SelectItem>
            <SelectItem value="inquiry" className="text-xs">Tenant Inquiries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-border/50">
              <TableHead className="text-xs text-muted-foreground">Email</TableHead>
              <TableHead className="text-xs text-muted-foreground">Name</TableHead>
              <TableHead className="text-xs text-muted-foreground">Source</TableHead>
              <TableHead className="text-xs text-muted-foreground">Details</TableHead>
              <TableHead className="text-xs text-muted-foreground">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <Mail className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No contacts found</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(contact => (
              <TableRow key={contact.email} className="border-border/30 hover:bg-secondary/20">
                <TableCell className="text-sm text-foreground font-mono">{contact.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{contact.name || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {[...contact.sources].map(s => (
                      <Badge key={s} variant="outline" className={`text-[10px] capitalize ${SOURCE_COLORS[s] || ""}`}>{SOURCE_LABELS[s] || s}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{[...contact.details].join(" · ") || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{contact.latest ? format(new Date(contact.latest), "MMM d, yyyy") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
