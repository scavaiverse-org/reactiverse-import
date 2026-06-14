// Content + pricing for the 15 June pre-sale page and its purchase overlay.
// Ticket prices mirror the real AOM early-bird tiers seeded in
// 0009_aom_ticket_pricing.sql (launch promo ends 2026-06-29). Tenant pricing
// mirrors the vendor model in the same migration (SGD 300 onboarding + 12%
// commission, optional SGD 150/mo featured placement).
//
// Payment is handled manually via PayNow — there is no live payment gateway —
// and an admin grants the e-ticket / tenant role after verifying the transfer.

// AOM tenant id (Asian Operatic Museum) so pre-sale tickets are attributed to
// the launching museum. Matches 0009_aom_ticket_pricing.sql.
export const PRESALE_TENANT_ID = "91bc9b6c-e084-457f-9828-c3899110568c";

export const PRESALE_LAUNCH_DATE = "2026-06-15";
export const PRESALE_PROMO_ENDS_AT = "2026-06-29";

export const PAYNOW = {
  uen: "20172486D",
  payeeName: "SCAVerse",
};

// The exact steps a buyer must follow. Surfaced in the overlay and on the page.
export const PURCHASE_INSTRUCTIONS = [
  "Open your bank app and choose PayNow.",
  `Pay to UEN ${PAYNOW.uen} (${PAYNOW.payeeName}).`,
  "Transfer the exact amount of the item you want (see the price shown).",
  "In the PayNow comment / reference field, type your EMAIL ADDRESS.",
  "Complete the transfer, then submit the form below so we can match your payment.",
  "An admin verifies the payment and activates your access manually — usually within 24 hours.",
];

export const PRESALE_TICKET_PACKAGES = [
  {
    id: "standard_pass",
    label: "Standard Pass",
    price: 8,
    regularPrice: 12,
    currency: "SGD",
    accessMode: "virtual",
    tagline: "The full virtual walkthrough.",
    features: [
      "Full walkthrough — all published rooms",
      "48-hour access window",
      "Early-bird price (regular SGD 12)",
    ],
  },
  {
    id: "premium_pass",
    label: "Premium Pass",
    price: 12,
    regularPrice: 18,
    currency: "SGD",
    accessMode: "virtual",
    highlight: true,
    tagline: "Everything, plus the AI Cultural Guide.",
    features: [
      "Everything in Standard Pass",
      "AI Cultural Guide included",
      "Hidden exhibits unlocked",
      "Downloadable story cards",
      "Early-bird price (regular SGD 18)",
    ],
  },
  {
    id: "family_pass",
    label: "Family Pass (up to 5)",
    price: 29,
    regularPrice: 39,
    currency: "SGD",
    accessMode: "hybrid",
    tagline: "Bring the whole family.",
    features: [
      "Up to 5 visitors",
      "All Premium Pass features",
      "Kid-friendly AI guide mode",
      "Early-bird price (regular SGD 39)",
    ],
  },
  {
    id: "school_block_40",
    label: "School Block — 40 pax",
    price: 280,
    currency: "SGD",
    accessMode: "hybrid",
    tagline: "For classrooms (SGD 7 / student).",
    features: [
      "40 student passes (SGD 7/pax)",
      "Teacher dashboard link",
      "Learning-mode AI guide",
    ],
  },
  {
    id: "school_block_100",
    label: "School Block — 100 pax",
    price: 600,
    currency: "SGD",
    accessMode: "hybrid",
    tagline: "For whole cohorts (SGD 6 / student).",
    features: [
      "100 student passes (SGD 6/pax)",
      "MOE-friendly invoice",
      "Redemption codes",
    ],
  },
  {
    id: "corporate_block_50",
    label: "Corporate Block — 50 pax",
    price: 650,
    currency: "SGD",
    accessMode: "hybrid",
    tagline: "Team experiences, co-branded.",
    features: [
      "50 Premium passes (SGD 13/pax)",
      "Co-branded landing screen",
      "Invoice-ready enquiry",
    ],
  },
  {
    id: "event_vip_tour",
    label: "Event / VIP Private Tour",
    price: 1500,
    currency: "SGD",
    accessMode: "hybrid",
    tagline: "A hosted, private premiere.",
    features: [
      "Timed group session",
      "Custom welcome from host",
      "Host commentary throughout",
    ],
  },
];

export function getPresalePackage(id) {
  return PRESALE_TICKET_PACKAGES.find((pkg) => pkg.id === id) || null;
}

// Tenant offer: a 1-week free trial of the creator tools, with the post-trial
// pricing shown up front. The trial itself requires no payment — the buyer just
// submits their details and an admin activates the trial role.
export const TENANT_TRIAL_OFFER = {
  id: "tenant_trial",
  label: "Tenant — 1 Week Free Trial",
  trialDays: 7,
  price: 0,
  currency: "SGD",
  tagline: "Build your own museum free for 7 days.",
  includes: [
    "Full access to the Experience Editor",
    "Full access to the state-of-the-art 3D World Editor",
    "Your own virtual museum space inside SCAVerse",
    "Upload images, video, audio, 3D models, and stories",
    "Publish guided walkthroughs and visitor pages",
  ],
  afterTrial: [
    "SGD 300 one-time onboarding fee",
    "12% commission per ticket sale",
    "Optional featured placement — SGD 150 / month",
  ],
  afterTrialNote: "No charge during the 7-day trial. Onboarding is only invoiced if you continue after the trial.",
};

// Fallback card shown in PreBookingFeature when the DB query returns [] or
// errors. Covers: AOM already published (no longer "pre-sale" in DB terms),
// RLS blocking, or network failure. CTA routes to /presale.
export const PRESALE_FALLBACK_MUSEUM = {
  id: "presale-fallback-aom",
  name: "Asian Operatic Museum",
  description:
    "Singapore's first cinematic virtual museum experience. Reserve your early-bird ticket and be among the first visitors when we open — SCAVerse launch 2026.",
  useFallbackCta: true, // CTA → /presale instead of museumPath(slug, "tickets")
};

// Returns the museums list to render: DB result when available, otherwise the
// hardcoded fallback. Pure function — exported so tests can import it directly.
export function selectPresaleDisplayMuseums(museums) {
  return museums.length ? museums : [PRESALE_FALLBACK_MUSEUM];
}

export const PRESALE_FAQ = [
  {
    q: "When does the pre-sale run?",
    a: "Pre-sale is on now ahead of the 15 June 2026 soft launch. Early-bird ticket prices are available until 29 June 2026.",
  },
  {
    q: "How is payment handled?",
    a: `All payments are made by PayNow to UEN ${PAYNOW.uen}. After you transfer and submit the form, an admin verifies your payment and activates your access manually.`,
  },
  {
    q: "How will I get my e-ticket or tenant access?",
    a: "Access is granted to the email address you put in the PayNow comment and the form. You'll be notified once an admin activates it — usually within 24 hours.",
  },
  {
    q: "Is the tenant trial really free?",
    a: "Yes. The 7-day trial of the Experience Editor and 3D World Editor is free. The onboarding fee and commission only apply if you choose to continue after the trial.",
  },
];
