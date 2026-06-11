-- Update Asian Operatic Museum ticket pricing/packages to match the
-- AOM SCAVerse Monetization & Promo proposal (soft launch 15 Jun 2026).
-- Replaces the placeholder ticket_types seeded in restore_asian_operatic_museum.sql
-- with the real Individual (A) and Bulk/Institutional (B) pricing tiers.
-- Source: AOM_SCAVerse_Monetization_and_Promo.pdf, "Day-One pricing (proposed)".

UPDATE public.module_configs
SET config_json = '{
  "currency": "SGD",
  "checkout_mode": "demo",
  "payment_provider_status": "not_connected",
  "schema_version": 3,
  "launch_promo": {
    "active": true,
    "ends_at": "2026-06-29",
    "note": "Early-bird pricing for the first 14 days after the 15 Jun 2026 soft launch."
  },
  "ticket_types": [
    {"id":"standard_pass","type":"standard_pass","label":"Standard Pass","price":8,"regular_price":12,"currency":"SGD","enabled":true,"access_mode":"virtual","features":["Full walkthrough — all published rooms","48-hour access window","Launch promo price (regular SGD 12)"]},
    {"id":"premium_pass","type":"premium_pass","label":"Premium Pass","price":12,"regular_price":18,"currency":"SGD","enabled":true,"access_mode":"virtual","features":["Everything in Standard Pass","AI Cultural Guide included","Hidden exhibits unlocked","Downloadable story cards","Launch promo price (regular SGD 18)"]},
    {"id":"family_pass","type":"family_pass","label":"Family Pass (up to 5)","price":29,"regular_price":39,"currency":"SGD","enabled":true,"access_mode":"hybrid","features":["Up to 5 visitors","All Premium Pass features","Kid-friendly AI guide mode","Launch promo price (regular SGD 39)"]},
    {"id":"school_block_40","type":"school_block_40","label":"School Block — 40 pax","price":280,"currency":"SGD","enabled":true,"access_mode":"hybrid","features":["40 student passes (SGD 7/pax)","Teacher dashboard link","Learning-mode AI guide"]},
    {"id":"school_block_100","type":"school_block_100","label":"School Block — 100 pax","price":600,"currency":"SGD","enabled":true,"access_mode":"hybrid","features":["100 student passes (SGD 6/pax)","MOE-friendly invoice","Redemption codes"]},
    {"id":"corporate_block_50","type":"corporate_block_50","label":"Corporate Block — 50 pax","price":650,"currency":"SGD","enabled":true,"access_mode":"hybrid","features":["50 Premium passes (SGD 13/pax)","Co-branded landing screen","Invoice-ready enquiry"]},
    {"id":"event_vip_tour","type":"event_vip_tour","label":"Event / VIP Private Tour","price":1500,"currency":"SGD","enabled":true,"access_mode":"hybrid","features":["Timed group session","Custom welcome from host","Host commentary throughout"]}
  ],
  "seed_source": "AOM_SCAVERSE_MONETIZATION_PROMO_2026_06_15"
}'::jsonb,
    record_count = 7,
    config_completeness = 100,
    last_updated = now(),
    updated_at = now()
WHERE tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c'
  AND module_key = 'ticketing';

-- Align vendor marketplace pricing config with the proposal's two-tier model
-- (SGD 300 one-time onboarding + 12% commission, optional SGD 150/mo featured
-- placement) — replaces the old four-tier monthly slot pricing.
UPDATE public.module_configs
SET config_json = config_json
    || '{
      "slot_types": ["standard", "featured"],
      "onboarding_fee_sgd": 300,
      "commission_percent": 12,
      "featured_placement_price_sgd": 150,
      "featured_placement_max_slots": 4
    }'::jsonb,
    last_updated = now(),
    updated_at = now()
WHERE tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c'
  AND module_key = 'vendors';
