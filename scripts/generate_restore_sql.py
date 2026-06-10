#!/usr/bin/env python3
"""Generate SQL that restores the Asian Operatic Museum content from the
Base44 export CSVs into Supabase, merging the typo'd duplicate tenant
"Asia Operatic Museum Singapore" into the canonical "Asian Operatic Museum".

Output: supabase/restore_asian_operatic_museum.sql (paste into Supabase SQL Editor).
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORTS = ROOT / "data" / "exports"
OUT = ROOT / "supabase" / "restore_asian_operatic_museum.sql"
SCHEMA_FILES = [
    ROOT / "src" / "supabase" / "migrations" / "0001_initial_schema.sql",
    ROOT / "src" / "supabase" / "migrations" / "0005_missing_entities.sql",
]

B44_TENANT_ID = "6a220da4b282e8b27dbefda9"          # Base44 id of the old AOM tenant
B44_TENANT_ID_2 = "6a1741d0b8942643dc98f5d5"        # Base44 id of the original AOM tenant
TARGET_TENANT_ID = "91bc9b6c-e084-457f-9828-c3899110568c"  # Supabase "Asian Operatic Museum"
DUP_TENANT_ID = "9ab10e05-3f64-5602-97da-c2a1e2ceeec7"     # Supabase typo'd duplicate
TARGET_NAME = "Asian Operatic Museum"

REPLACEMENTS = [
    (B44_TENANT_ID, TARGET_TENANT_ID),
    (B44_TENANT_ID_2, TARGET_TENANT_ID),
    ("Asian Operatic Museum Singapore", TARGET_NAME),
    ("Asia Operatic Museum Singapore", TARGET_NAME),
    ("Asia Operatic Museum", TARGET_NAME),
    ("asia-operatic-museum", "asian-operatic-museum"),
]

csv.field_size_limit(10**9)


def load_schema_types():
    """Parse CREATE TABLE statements -> {table: {column: type}}."""
    sql = "".join(f.read_text() for f in SCHEMA_FILES)
    tables = {}
    for m in re.finditer(r"create table public\.(\w+) \((.*?)\n\);", sql, re.S):
        cols = {}
        for line in m.group(2).splitlines():
            line = line.strip().rstrip(",")
            if not line or line.startswith(("unique", "check", "primary key (", "foreign")):
                continue
            parts = line.split()
            if len(parts) >= 2:
                cols[parts[0]] = parts[1].lower()
        tables[m.group(1)] = cols
    return tables


def camel_to_snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def apply_replacements(value):
    for old, new in REPLACEMENTS:
        value = value.replace(old, new)
    return value


def sql_quote(value):
    return "'" + value.replace("'", "''") + "'"


def to_sql_literal(raw, pgtype):
    """Convert a CSV string value to a SQL literal for the given postgres type."""
    if raw is None or raw == "":
        return "NULL"
    raw = apply_replacements(raw)
    if pgtype.startswith("uuid"):
        if re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", raw, re.I):
            return sql_quote(raw)
        return "NULL"  # Base44 hex ids are not valid uuids
    if pgtype.startswith("jsonb"):
        try:
            json.loads(raw)
        except (ValueError, TypeError):
            return "NULL"
        return sql_quote(raw) + "::jsonb"
    if pgtype.startswith("bool"):
        return "true" if raw.strip().lower() in ("true", "t", "1", "yes") else "false"
    if pgtype.startswith(("numeric", "int", "bigint", "double", "real")):
        try:
            float(raw)
        except ValueError:
            return "NULL"
        return raw
    if pgtype.startswith("timestamptz") or pgtype.startswith("timestamp"):
        if not re.match(r"\d{4}-\d{2}-\d{2}", raw):
            return "NULL"
        return sql_quote(raw)
    if pgtype.endswith("[]"):
        try:
            arr = json.loads(raw)
            if isinstance(arr, list):
                return "ARRAY[" + ",".join(sql_quote(str(x)) for x in arr) + "]::text[]" if arr else "NULL"
        except (ValueError, TypeError):
            pass
        return "NULL"
    return sql_quote(raw)


def row_is_aom(row):
    blob = (row.get("tenant_id") or "") + (row.get("tenantId") or "") + (row.get("tenant_name") or "")
    return B44_TENANT_ID in blob or "Operatic Museum" in blob


def build_inserts(csv_name, table, types, conflict_clause, extra_map=None, only_published=False):
    """Generate INSERT statements for AOM rows of one CSV."""
    path = EXPORTS / f"{csv_name}_export.csv"
    rows = [r for r in csv.DictReader(path.open()) if row_is_aom(r)]
    if only_published:
        rows = [r for r in rows if (r.get("status") or r.get("publishState") or "") not in ("archived", "deleted")]
    table_cols = types[table]
    stmts = []
    for r in rows:
        values = {}
        for key, raw in r.items():
            col = (extra_map or {}).get(key) or camel_to_snake(key)
            if col in ("created_date", "updated_date", "is_sample", "created_by") and col not in table_cols:
                continue
            if col not in table_cols or col in values and values[col] != "NULL":
                continue
            values[col] = to_sql_literal(raw, table_cols[col])
        # canonical overrides
        if "tenant_id" in table_cols:
            values["tenant_id"] = sql_quote(TARGET_TENANT_ID)
        if "museum_id" in table_cols:
            values["museum_id"] = sql_quote(TARGET_TENANT_ID)
        if "tenant_name" in table_cols:
            values["tenant_name"] = sql_quote(TARGET_NAME)
        if "tenant_slug" in table_cols:
            values["tenant_slug"] = sql_quote("asian-operatic-museum")
        # created/updated fallbacks from Base44 export columns
        if "created_at" in table_cols and values.get("created_at", "NULL") == "NULL":
            values["created_at"] = to_sql_literal(r.get("created_date") or r.get("createdAt") or "", "timestamptz")
        if "updated_at" in table_cols and values.get("updated_at", "NULL") == "NULL":
            values["updated_at"] = to_sql_literal(r.get("updated_date") or r.get("updatedAt") or "", "timestamptz")
        values = {k: v for k, v in values.items() if v != "NULL"}
        cols = ", ".join(values.keys())
        vals = ", ".join(values.values())
        stmts.append(f"INSERT INTO public.{table} ({cols})\nVALUES ({vals})\n{conflict_clause};")
    return rows, stmts


def main():
    types = load_schema_types()
    parts = [
        "-- Restore Asian Operatic Museum content from Base44 exports",
        "-- Generated by scripts/generate_restore_sql.py — paste into Supabase SQL Editor and Run.",
        "BEGIN;",
        "",
        "-- 1. Move the 30 exhibits from the typo'd duplicate tenant onto the canonical museum",
        f"""UPDATE public.exhibits
SET tenant_id = '{TARGET_TENANT_ID}',
    tenant_name = '{TARGET_NAME}',
    title = REPLACE(title, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    summary = REPLACE(summary, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    description = REPLACE(description, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    long_description = REPLACE(long_description, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    narrative_text = REPLACE(narrative_text, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    ai_guide_context = REPLACE(ai_guide_context, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    historical_significance = REPLACE(historical_significance, 'Asia Operatic Museum', 'Asian Operatic Museum')
WHERE tenant_id = '{DUP_TENANT_ID}';""",
        "",
        "-- Also fix the typo anywhere else it remains in exhibits text",
        """UPDATE public.exhibits
SET tenant_name = REPLACE(tenant_name, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    description = REPLACE(description, 'Asia Operatic Museum', 'Asian Operatic Museum')
WHERE tenant_name LIKE '%Asia Operatic Museum%' OR description LIKE '%Asia Operatic Museum%';""",
        "",
    ]

    section_no = 2
    specs = [
        ("ModuleConfig", "module_configs",
         "ON CONFLICT (tenant_id, module_key) DO UPDATE SET config_json = EXCLUDED.config_json, enabled = EXCLUDED.enabled, status = EXCLUDED.status, updated_at = now()"),
        ("ExperienceConfig", "experience_configs", "ON CONFLICT (id) DO NOTHING"),
        ("MuseumPageConfig", "museum_page_configs", "ON CONFLICT (id) DO NOTHING"),
        ("ContentAsset", "content_assets", "ON CONFLICT (id) DO NOTHING"),
        ("TenantContent", "tenant_content", "ON CONFLICT (id) DO NOTHING"),
        ("Vendor", "vendors", "ON CONFLICT (id) DO NOTHING"),
    ]
    for csv_name, table, conflict in specs:
        rows, stmts = build_inserts(csv_name, table, types, conflict)
        parts.append(f"-- {section_no}. Import {len(stmts)} {table} rows from {csv_name}_export.csv")
        parts.extend(stmts)
        parts.append("")
        section_no += 1
        print(f"{table}: {len(stmts)} rows")

    parts += [
        f"-- {section_no}. Archive the now-empty duplicate tenant so the directory shows one museum",
        f"""UPDATE public.museum_tenants
SET status = 'archived',
    name = 'Asian Operatic Museum (archived duplicate)',
    description = 'Archived duplicate record. The live museum is Asian Operatic Museum (asian-operatic-museum).'
WHERE id = '{DUP_TENANT_ID}';""",
        "",
        "COMMIT;",
        "",
        "-- Verification (run separately if you like):",
        "-- SELECT name, slug, status FROM museum_tenants;",
        "-- SELECT module_key, status FROM module_configs WHERE tenant_id = '" + TARGET_TENANT_ID + "';",
        "-- SELECT count(*) FROM exhibits WHERE tenant_id = '" + TARGET_TENANT_ID + "';",
    ]
    OUT.write_text("\n".join(parts))
    print(f"\nWrote {OUT} ({OUT.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
