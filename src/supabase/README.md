# Supabase Migration Files

Run these migrations against a fresh Supabase project:

```bash
supabase db push
```

Files:

1. `0001_initial_schema.sql` — database tables, types, indexes.
2. `0002_functions_triggers.sql` — profile creation and updated_at triggers.
3. `0003_rls_policies.sql` — row-level security policies.
4. `0004_storage_buckets.sql` — storage buckets and storage policies.

Review assumptions in `../SUPABASE_SCHEMA.md` before production use.