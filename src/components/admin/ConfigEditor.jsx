import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save } from "lucide-react";
import { toast } from "sonner";

/**
 * Merge a saved config object with its defaults.
 * If the saved config is missing, or an array field exists in defaults but is
 * empty/missing in the saved config, fall back to the default for that field.
 * This prevents truthy-but-empty/partial records from rendering blank rows.
 */
function mergeWithDefaults(saved, defaults) {
  if (!saved || typeof saved !== "object") return defaults;
  const merged = { ...defaults, ...saved };
  for (const key of Object.keys(defaults)) {
    if (Array.isArray(defaults[key]) && (!Array.isArray(saved[key]) || saved[key].length === 0)) {
      merged[key] = defaults[key];
    }
  }
  return merged;
}

/**
 * ConfigEditor supports two valid modes:
 * - module: requires moduleKey, fieldKey optional
 * - experience: requires fieldKey, moduleKey optional
 */
export default function ConfigEditor({ tenant, configType = "module", moduleKey = null, fieldKey = null, title, description, defaultValue = {}, children = () => null }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(defaultValue);

  const isModuleConfig = configType === "module";
  const hasRequiredKey = isModuleConfig ? !!moduleKey : !!fieldKey;
  const queryKey = ["config-editor", configType, moduleKey || fieldKey || "unkeyed", tenant?.id];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    enabled: !!tenant?.id && hasRequiredKey,
    queryFn: () => isModuleConfig
      ? base44.entities.ModuleConfig.filter({ tenant_id: tenant.id, module_key: moduleKey })
      : base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id }),
  });

  const record = records[0];

  useEffect(() => {
    if (!tenant?.id) return;
    if (isModuleConfig) {
      setDraft(mergeWithDefaults(record?.config_json, defaultValue));
    } else {
      setDraft(record?.[fieldKey] || defaultValue);
    }
    }, [tenant?.id, record?.id, record?.updated_date, isModuleConfig, fieldKey]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Select a tenant before saving.");
      if (isModuleConfig && !moduleKey) throw new Error("Module key is required before saving module configuration.");
      if (!isModuleConfig && !fieldKey) throw new Error("Field key is required before saving experience configuration.");
      const now = new Date().toISOString();

      if (configType === "module") {
        const payload = {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          module_key: moduleKey,
          enabled: tenant.enabled_modules?.includes(moduleKey) ?? true,
          config_json: draft,
          status: "healthy",
          config_completeness: 100,
          last_updated: now,
        };
        const saved = record ? await base44.entities.ModuleConfig.update(record.id, payload) : await base44.entities.ModuleConfig.create(payload);
        await base44.entities.AuditLog.create({ action: "save_module_config", target_type: "ModuleConfig", target_id: saved?.id || record?.id, target_name: `${tenant.name} ${moduleKey}`, details: `${moduleKey} configuration saved for ${tenant.name}`, timestamp: now, severity: "info" });
        return saved;
      }

      const payload = {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        [fieldKey]: draft,
        last_updated: now,
      };
      const saved = record ? await base44.entities.ExperienceConfig.update(record.id, payload) : await base44.entities.ExperienceConfig.create(payload);
      await base44.entities.AuditLog.create({ action: "save_experience_config", target_type: "ExperienceConfig", target_id: saved?.id || record?.id, target_name: `${tenant.name} ${fieldKey}`, details: `${fieldKey} saved for ${tenant.name}`, timestamp: now, severity: "info" });
      return saved;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["experience-config", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["module-configs", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["master-module-configs"] });
      await queryClient.invalidateQueries({ queryKey: ["master-experience-configs"] });
      await queryClient.invalidateQueries({ queryKey: ["mod-configs"] });
      await queryClient.invalidateQueries({ queryKey: ["public-ticket-config", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["public-onboarding-config", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["public-ai-guide-config", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["public-walkthrough-config", tenant?.id] });
      await queryClient.invalidateQueries({ queryKey: ["master-audit"] });
      toast.success(`${title} saved`);
    },
    onError: (error) => {
      toast.error(error?.message || "Save failed. Please try again.");
    },
  });

  if (!tenant) {
    return <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-400">Select or create a museum tenant before saving configuration.</div>;
  }

  return (
    <div className="bg-white/[0.03] border border-primary/15 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {mutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
      {typeof children === "function" ? children({ draft, setDraft, isLoading, record }) : null}
    </div>
  );
}