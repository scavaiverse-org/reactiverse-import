import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Filter, Lock, Monitor, Shield, Users } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES } from "@/lib/rbac";

const ROLE_COLORS = ["text-blue-400", "text-violet-400", "text-cyan-400", "text-primary", "text-amber-400", "text-emerald-400", "text-pink-400", "text-red-400"];

function formatLabel(value = "") {
  return String(value || "unassigned").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UsersAccess() {
  const queryClient = useQueryClient();
  // profiles (not legacy user_profiles) is the role source of truth — it's
  // what getAuthUser/the tour gate/edge functions actually read.
  const { data: users = [], isLoading: loadingUsers } = useQuery({ queryKey: ["ua-user-profiles"], queryFn: () => base44.entities.Profile.list("email", 500) });
  const { data: tenantAccess = [] } = useQuery({ queryKey: ["ua-tenant-access"], queryFn: () => base44.entities.TenantAccess.list("tenant_id", 500) });
  const { data: rolePermissions = [] } = useQuery({ queryKey: ["ua-role-permissions"], queryFn: () => base44.entities.RolePermission.list("role", 500) });

  const roles = useMemo(() => {
    const values = [...Object.values(ROLES), ...rolePermissions.map((item) => item.role), ...users.map((user) => user.role)].filter(Boolean);
    return [...new Set(values)].sort();
  }, [rolePermissions, users]);

  const userGroups = useMemo(() => {
    const counts = users.reduce((acc, user) => {
      const role = user.role || "unassigned";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [users]);

  const accessScopes = useMemo(() => {
    const counts = tenantAccess.reduce((acc, item) => {
      const key = item.scope_status || "No scope status";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [tenantAccess]);

  const franchiseLeads = useMemo(() => users.filter((user) => user.franchise_intent), [users]);

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.Profile.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ua-user-profiles"] }),
  });

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Users & Access" }]} />

      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-blue-400 font-semibold mb-1">LAYER 1</p>
        <h1 className="text-2xl font-display font-bold text-foreground">Users & Access Layer</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage real user groups, tenant access scopes, and role assignments across museum tenants.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-foreground">User Groups by Role</p>
          </div>
          <div className="space-y-2">
            {userGroups.map(([role, count], index) => {
              const color = ROLE_COLORS[index % ROLE_COLORS.length];
              const Icon = role === "admin" || role.includes("operator") ? Shield : Users;
              return (
                <div key={role} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-foreground">{formatLabel(role)}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${color}`}>{count.toLocaleString()}</span>
                </div>
              );
            })}
            {!loadingUsers && userGroups.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No user profile records found</p>}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total Registered Users</span>
            <span className="text-sm font-display font-bold text-primary">{users.length.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-foreground">Tenant Access Records</p>
          </div>
          <div className="space-y-2.5">
            {accessScopes.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/6">
                <span className="text-xs text-foreground">{formatLabel(status)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-primary">{count.toLocaleString()}</span>
                  {status !== "No scope status" && <StatusBadge status={status} />}
                </div>
              </div>
            ))}
            {accessScopes.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No tenant access records found</p>}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-blue-400" />Role Assignments</p>
          <span className="text-xs text-muted-foreground">Canonical platform roles (rbac.js)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-white/5">
                <th className="pb-2 text-left font-medium">Name</th>
                <th className="pb-2 text-left font-medium">Email</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium">Tenant</th>
                <th className="pb-2 text-left font-medium">Franchise Interest</th>
                <th className="pb-2 text-left font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3 text-foreground">{user.display_name || user.full_name || "Unnamed user"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{user.email}</td>
                  <td className="py-2 pr-3">{user.status ? <StatusBadge status={user.status} /> : <span className="text-muted-foreground">Not set</span>}</td>
                  <td className="py-2 pr-3 text-foreground/70">{user.tenant_id || "Global"}</td>
                  <td className="py-2 pr-3">
                    {user.franchise_intent ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border text-amber-400 bg-amber-400/10 border-amber-400/30">
                        <span className="w-1 h-1 rounded-full bg-current" />INTERESTED
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 min-w-44">
                    <Select value={user.role || ""} onValueChange={(role) => changeRole.mutate({ id: user.id, role })} disabled={changeRole.isPending || roles.length === 0}>
                      <SelectTrigger className="h-8 border-white/10 bg-white/[0.03] text-xs">
                        <SelectValue placeholder="Assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => <SelectItem key={role} value={role}>{formatLabel(role)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No user profile records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] border border-amber-400/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-foreground">Franchise / Tenant Leads</p>
          </div>
          <div className="space-y-2">
            {franchiseLeads.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs text-foreground">{user.display_name || user.full_name || "Unnamed user"}</p>
                  <p className="text-[11px] text-muted-foreground">{user.email}</p>
                </div>
                <Link to="/platform/admin/tenants" className="text-[11px] text-primary underline-offset-4 hover:underline">Review</Link>
              </div>
            ))}
            {franchiseLeads.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No signups have indicated franchise interest yet</p>}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-foreground">Data Protection (PDPA)</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            User signups are authenticated and stored through Supabase Auth, which salts and hashes every password
            with bcrypt before it ever reaches application storage. Passwords are never written to this table, never
            logged, and are not retrievable in plaintext by admins — only the profile fields shown above (name, email,
            role, tenant scope, and franchise interest) are stored here for account management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Onboarding Module", path: "/platform/admin/modules/onboarding" },
          { label: "Ticketing Module", path: "/platform/admin/modules/ticketing" },
          { label: "AI Guide Module", path: "/platform/admin/modules/ai-guide" },
          { label: "Analytics Module", path: "/platform/admin/modules/analytics" },
        ].map(l => (
          <Link key={l.path} to={l.path} className="group flex items-center justify-between p-3 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
            <span className="text-xs text-foreground">{l.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}