# SCAVerse Admin Handbook

Status: Draft for staff testing and export-readiness freeze

## Admin Rule

Only change content needed for the demo or migration proof. Do not add new feature ideas during export freeze.

## Main Admin Flow

1. Login.
2. Open dashboard.
3. Select tenant.
4. Update tenant settings only if needed.
5. Review pages/content.
6. Review tickets.
7. Review vendors.
8. Review media placeholders.
9. Review analytics.
10. Review QA Sentinel.
11. Publish only after QA checks pass.

## Content Management

Use this area to manage:

- homepage content
- walkthrough content
- exhibit/story content
- page sections
- public-facing copy

Before publishing, check:

- no empty title
- no empty section
- public route works
- mobile layout is acceptable
- content is culturally safe
- demo placeholders are clearly marked

## Media Management

Use media tools to replace placeholder assets.

Before marking media production-ready, confirm:

- file is approved
- rights are cleared
- alt text exists
- public/private visibility is correct
- tenant ownership is correct
- preview works
- delete/replace behavior works

## Tickets

Use tickets to configure demo or real ticket options.

If payment is not connected, mark checkout as demo and do not claim live payment.

## Vendors

Use vendor tools to review partner/vendor records.

Do not enter real private personal data during demo mode.

## Analytics

Use analytics to review seeded demo patterns and later real visitor activity.

Seeded analytics are not production proof.

## QA Sentinel

Use QA Sentinel as the export gate.

Export is blocked if critical or major issues are unresolved.

## Migration Notes

Before export, staff must confirm:

- auth works
- tenant isolation works
- admin routes are protected
- public pages show only public data
- uploads work
- AI guide does not invent or leak data
- rollback is ready