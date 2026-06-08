# SCAVerse Rollback Plan

Status: Required before export or migration cutover

## Rollback Assets to Preserve

Before staging or production export, back up:

- current source code
- Base44 entity data
- Supabase schema and migrations
- environment variables
- uploaded media files
- admin configs
- prompt records
- QA Sentinel export
- current live screenshots
- current deployment URL and build metadata

## Rollback Trigger Conditions

Rollback immediately if any of these happen after cutover:

- login fails for admins
- tenant admins can access another tenant
- public pages expose private data
- ticket/vendor/media writes fail
- uploads store files in wrong bucket/path
- walkthrough or homepage becomes blank
- AI leaks private/admin data
- staging/prod build has route-breaking errors
- database writes do not persist after refresh

## Rollback Steps

1. Stop new user/admin changes.
2. Restore previous deployment/build.
3. Restore previous environment variables.
4. Restore previous database snapshot if data was modified.
5. Restore previous media/storage snapshot if uploads changed.
6. Confirm admin login works.
7. Confirm public route loads.
8. Confirm tenant data isolation.
9. Record rollback reason in QA Sentinel / audit log.
10. Reopen migration blockers before retry.

## Minimum Rollback Proof

- [ ] Previous build can be redeployed
- [ ] Previous data backup is accessible
- [ ] Previous env values are recoverable
- [ ] Previous media files are recoverable
- [ ] Rollback owner is assigned
- [ ] Rollback decision path is documented