// Canonical legal copy for SCAVerse platform-level legal pages.
// These are public, platform-owned pages (not tenant-scoped).

const LAST_UPDATED = "6 June 2026";

// Single source of truth for the public contact email. Update here to change
// it everywhere (legal pages, contact page, footer).
export const CONTACT_EMAIL = "contact@scaverse.org";

export const LEGAL_PAGES = {
  "/privacy": {
    title: "Privacy Policy",
    intro:
      "SCAVerse is committed to protecting your personal data in accordance with Singapore's Personal Data Protection Act (PDPA). This policy explains what we collect, how we use it, and your rights.",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect information you provide directly — such as your name, email address, and booking details when you purchase tickets or submit enquiries — as well as technical data (device, browser, and usage analytics) collected automatically as you navigate the platform.",
      },
      {
        heading: "How We Use Your Information",
        body: "Your data is used to operate museum access, process ticket reservations, respond to enquiries, provide visitor support, improve our services, and send service-related communications. We do not sell your personal data.",
      },
      {
        heading: "Data Sharing & Tenant Scope",
        body: "Each museum (tenant) on SCAVerse only receives data relevant to your interactions with that museum. Tenant data is isolated and is never shared across museums or treated as public content.",
      },
      {
        heading: "Your Rights",
        body: `Under the PDPA you may request access to, correction of, or deletion of your personal data, and may withdraw consent at any time. To exercise these rights, email us at ${CONTACT_EMAIL}.`,
        email: CONTACT_EMAIL,
      },
      {
        heading: "Data Retention & Security",
        body: "We retain personal data only as long as necessary for the purposes described above or as required by law, and we apply reasonable technical and organisational safeguards to protect it.",
      },
    ],
  },
  "/terms": {
    title: "Terms of Use",
    intro:
      "These Terms of Use govern your access to and use of the SCAVerse platform. By using the platform you agree to these terms.",
    sections: [
      {
        heading: "Use of the Platform",
        body: "You agree to use SCAVerse lawfully and to respect museum ownership, cultural content rights, visitor safety, and the boundaries of each tenant museum. Public pages are render-only reflections of approved, published content.",
      },
      {
        heading: "Accounts",
        body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorised use.",
      },
      {
        heading: "Tickets & Purchases",
        body: "Ticket purchases are subject to availability and the issuing museum's terms. Prices and inclusions are shown at checkout. Completing a purchase forms a binding agreement subject to our Refund Policy.",
      },
      {
        heading: "Intellectual Property",
        body: "All cultural content, artwork, and museum materials remain the property of their respective owners. You may not reproduce, distribute, or create derivative works without authorisation.",
      },
      {
        heading: "Limitation of Liability",
        body: "SCAVerse is provided on an 'as is' basis. To the extent permitted by law, we are not liable for indirect or consequential losses arising from your use of the platform.",
      },
    ],
  },
  "/refund-policy": {
    title: "Refund & Cancellation Policy",
    intro:
      "This policy explains how refunds and cancellations are handled for tickets, packages, and corporate access purchased through SCAVerse.",
    sections: [
      {
        heading: "Standard Tickets",
        body: "Standard admission tickets may be cancelled and refunded up to 48 hours before the scheduled visit date. Cancellations made within 48 hours of the visit are non-refundable unless required by law.",
      },
      {
        heading: "Packages & Corporate Access",
        body: "Group, package, and corporate bookings are reviewed according to the relevant museum or partner agreement. Specific cancellation windows and fees are confirmed at the time of booking.",
      },
      {
        heading: "Pending Reservations",
        body: "Pending reservations do not activate until payment or approval is confirmed. An unconfirmed reservation may be cancelled at no charge.",
      },
      {
        heading: "How to Request a Refund",
        body: `To request a refund or cancellation, email us at ${CONTACT_EMAIL} with your booking reference. Approved refunds are returned to the original payment method within 14 business days.`,
        email: CONTACT_EMAIL,
      },
    ],
  },
  "/contact": {
    title: "Contact",
    intro:
      "We're here to help with museum visits, partnerships, accessibility support, and more.",
    sections: [
      {
        heading: "Email Us",
        body: `For any enquiry, email us at ${CONTACT_EMAIL} and our team will get back to you.`,
        email: CONTACT_EMAIL,
      },
      {
        heading: "Other Ways to Reach Us",
        body: "For quick answers about visits, tickets, add-ons, and accessibility, ask ARIA — the museum's AI guide — available on every museum page. For vendor participation, apply directly through the vendor application form on the Vendors page. For corporate enquiries and platform partnerships, use the Become a Tenant page to start a conversation with the SCAVerse team.",
      },
      {
        heading: "Response Times",
        body: "We aim to respond to all enquiries within two business days. Accessibility and urgent visit-related requests are prioritised.",
      },
    ],
  },
  "/accessibility": {
    title: "Accessibility Statement",
    intro:
      "SCAVerse is committed to making cultural experiences accessible to everyone, and we work toward conformance with WCAG 2.1 Level AA.",
    sections: [
      {
        heading: "Comfort Controls",
        body: "Every page includes COMFORT controls offering larger text, reduced motion, and calm mode. These preferences persist as you navigate the platform.",
      },
      {
        heading: "Ongoing Improvements",
        body: "We continuously improve accessibility across visitor, walkthrough, and administrative experiences, including keyboard navigation, screen-reader support, and colour contrast.",
      },
      {
        heading: "Feedback",
        body: `If you encounter an accessibility barrier, please email us at ${CONTACT_EMAIL} so we can address it.`,
        email: CONTACT_EMAIL,
      },
    ],
  },
};

export function getLegalPage(pathname) {
  return LEGAL_PAGES[pathname] || LEGAL_PAGES["/privacy"];
}

export const LEGAL_LAST_UPDATED = LAST_UPDATED;