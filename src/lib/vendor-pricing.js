// Shared vendor slot-type pricing/copy, derived from the `vendors` ModuleConfig
// (onboarding_fee_sgd, commission_percent, featured_placement_price_sgd,
// featured_placement_max_slots, slot_types — see migration 0009) so
// VendorRegister and Vendors stay in sync with whatever an admin configures
// in ModuleVendors instead of duplicating hardcoded copies of the same copy.

export const FALLBACK_VENDOR_SLOT_TYPES = [
  { value: "standard", label: "Standard Listing", price: "SGD 300 one-time", desc: "Storefront listing setup, product photography guidelines, and 12% commission per sale." },
  { value: "featured", label: "Featured Placement", price: "SGD 300 one-time + SGD 150/mo", desc: "Everything in Standard, plus homepage and room-exit placement (max 4 slots at a time). 12% commission per sale." },
];

export const FALLBACK_VENDOR_COMMISSION_NOTE = "All vendors: SGD 300 one-time onboarding fee covers storefront setup. SCAVerse takes a 12% commission on marketplace sales — you keep your own fulfilment.";

const SLOT_LABELS = { standard: "Standard Listing", featured: "Featured Placement" };

function describeSlot(id, commission, maxSlots) {
  if (id === "featured") {
    return `Everything in Standard, plus homepage and room-exit placement${maxSlots ? ` (max ${maxSlots} slots at a time)` : ""}. ${commission}% commission per sale.`;
  }
  if (id === "standard") {
    return `Storefront listing setup, product photography guidelines, and ${commission}% commission per sale.`;
  }
  return `${commission}% commission per sale.`;
}

export function buildVendorPricing(vendorConfig = {}) {
  const onboardingFee = Number(vendorConfig.onboarding_fee_sgd);
  const commission = Number(vendorConfig.commission_percent);
  const featuredPrice = Number(vendorConfig.featured_placement_price_sgd);
  const parsedMaxSlots = Number(vendorConfig.featured_placement_max_slots);
  const maxSlots = Number.isFinite(parsedMaxSlots) ? parsedMaxSlots : null;
  const hasPricing = Number.isFinite(onboardingFee) && Number.isFinite(commission);

  if (!hasPricing) {
    return { slotTypes: FALLBACK_VENDOR_SLOT_TYPES, commissionNote: FALLBACK_VENDOR_COMMISSION_NOTE };
  }

  const commissionNote = `All vendors: SGD ${onboardingFee} one-time onboarding fee covers storefront setup. SCAVerse takes a ${commission}% commission on marketplace sales — you keep your own fulfilment.`;

  const slotTypeIds = Array.isArray(vendorConfig.slot_types) && vendorConfig.slot_types.length
    ? vendorConfig.slot_types
    : FALLBACK_VENDOR_SLOT_TYPES.map((slot) => slot.value);

  const slotTypes = slotTypeIds.map((id) => ({
    value: id,
    label: SLOT_LABELS[id] || id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    price: id === "featured" && Number.isFinite(featuredPrice)
      ? `SGD ${onboardingFee} one-time + SGD ${featuredPrice}/mo`
      : `SGD ${onboardingFee} one-time`,
    desc: describeSlot(id, commission, maxSlots),
  }));

  return { slotTypes, commissionNote };
}
