import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BATCH_SIZE = 50;

// Base44 entity name -> Supabase table name
const ENTITY_TABLE_MAP: Record<string, string> = {
  ExperienceConfig:     'experience_configs',
  Exhibit:              'exhibits',
  MuseumPageConfig:     'museum_page_configs',
  AIGuideConfig:        'ai_guide_configs',
  TenantMedia:          'tenant_media',
  MusicAsset:           'music_assets',
  HomeConfig:           'home_configs',
  ModuleConfig:         'module_configs',
  MasterMediaRegistry:  'master_media_registry',
  ExperiencePreset:     'experience_presets',
  TenantContent:        'tenant_content',
  TicketType:           'ticket_types',
  MasterPrompt:         'master_prompts',
};

const camelToSnake = (s: string) =>
  s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

// Transform a Base44 record to a Supabase-ready row
function transformRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'created_date' || key === 'createdDate') {
      out['created_at'] = value;
    } else if (key === 'updated_date' || key === 'updatedDate') {
      out['updated_at'] = value;
    } else if (key === 'app_id' || key === 'entity_name') {
      // skip Base44 internals
    } else {
      // camelCase keys from Base44 SDK -> snake_case for Supabase
      out[camelToSnake(key)] = value;
    }
  }
  return out;
}

async function upsertBatch(table: string, rows: Record<string, unknown>[]): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const body = await res.text();
      errors.push(`Batch ${i / BATCH_SIZE + 1}: HTTP ${res.status} — ${body.slice(0, 200)}`);
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Allow caller to specify which entities to export; default = all 13
    const body = await req.json().catch(() => ({}));
    const requestedEntities: string[] = body.entities ?? Object.keys(ENTITY_TABLE_MAP);

    const report: Record<string, unknown> = {};

    for (const entityName of requestedEntities) {
      const table = ENTITY_TABLE_MAP[entityName];
      if (!table) {
        report[entityName] = { error: 'Unknown entity — not in migration map' };
        continue;
      }

      try {
        // Fetch up to 2000 records (split into pages if you have more)
        const page1 = await base44.asServiceRole.entities[entityName].filter({}, '-updated_date', 1000);
        const page2 = await base44.asServiceRole.entities[entityName].filter({}, 'updated_date', 1000);

        // Deduplicate by id
        const seen = new Set<string>();
        const allRecords: Record<string, unknown>[] = [];
        for (const r of [...page1, ...page2]) {
          const id = (r as Record<string, unknown>).id as string;
          if (id && !seen.has(id)) { seen.add(id); allRecords.push(r as Record<string, unknown>); }
        }

        const rows = allRecords.map(transformRecord);
        const result = await upsertBatch(table, rows);

        report[entityName] = {
          fetched: allRecords.length,
          upserted: result.inserted,
          errors: result.errors,
        };
      } catch (err) {
        report[entityName] = { error: (err as Error).message };
      }
    }

    return Response.json({ status: 'done', report }, { status: 200 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});
