// Builds a Singapore PayNow EMV QR Code payload (SGQR spec) and renders it as
// a data URL. Used as the fallback checkout method for the franchisee plan
// when Stripe isn't configured — the tenant pays SGD 300 via PayNow to the
// platform's UEN and we collect the reference manually.

import QRCode from "qrcode";

// TLV field: ID (2 digits) + length (2 digits, zero-padded) + value.
function field(id, value) {
  const str = String(value);
  const len = String(str.length).padStart(2, "0");
  return `${id}${len}${str}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over the payload up to and
// including the "6304" CRC tag+length, per the EMV QR spec.
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Build a static-amount PayNow QR payload string.
 * @param {object} opts
 * @param {string} opts.uen - Singapore UEN to pay (PayNow proxy).
 * @param {number} opts.amount - Amount in SGD, e.g. 300.
 * @param {string} [opts.reference] - Reference / bill number shown to the payer's bank app.
 * @param {string} [opts.merchantName] - Merchant name shown in the payer's bank app.
 * @param {boolean} [opts.editable] - Whether the payer can change the amount.
 */
export function buildPayNowPayload({ uen, amount, reference = "", merchantName = "SCAVerse", editable = false }) {
  if (!uen || typeof uen !== "string") {
    throw new Error("A valid UEN is required to build a PayNow payload");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("PayNow amount must be a positive number");
  }
  const merchantAccount = [
    field("00", "SG.PAYNOW"),
    field("01", "2"), // proxy type 2 = UEN
    field("02", uen),
    field("03", editable ? "1" : "0"),
  ].join("");

  const additionalData = reference ? field("01", reference.slice(0, 25)) : "";

  const parts = [
    field("00", "01"), // payload format indicator
    field("01", "12"), // point of initiation: dynamic / single-use
    field("26", merchantAccount),
    field("52", "0000"), // merchant category code (none)
    field("53", "702"), // SGD
    field("54", amount.toFixed(2)),
    field("58", "SG"),
    field("59", merchantName.slice(0, 25)),
    field("60", "Singapore"),
  ];
  if (additionalData) parts.push(field("62", additionalData));

  const withoutCrc = `${parts.join("")}6304`;
  return `${withoutCrc}${crc16(withoutCrc)}`;
}

/**
 * Returns a PNG data URL for the PayNow QR code, ready for an <img src>.
 */
export async function buildPayNowQrDataUrl(opts) {
  const payload = buildPayNowPayload(opts);
  return QRCode.toDataURL(payload, { margin: 1, width: 320, color: { dark: "#1c1c22", light: "#ffffff" } });
}
