export const adPlacements = ["home", "content"] as const;
export type AdPlacement = (typeof adPlacements)[number];
const slotEnv: Record<AdPlacement, string> = {
  home: "ADSENSE_SLOT_HOME",
  content: "ADSENSE_SLOT_CONTENT",
};
export function adsConfig() {
  const client = process.env.ADSENSE_CLIENT_ID || "";
  const valid =
    /^ca-pub-\d{16}$/.test(client) && client !== "ca-pub-0000000000000000";
  return {
    client: valid ? client : null,
    enabled:
      valid &&
      process.env.ADSENSE_ENABLED === "true" &&
      process.env.ADSENSE_CONSENT_READY === "true",
    // Shows labelled, empty placeholder boxes so layouts can be reviewed
    // before approval. Never loads Google scripts on its own.
    preview: process.env.ADSENSE_PREVIEW === "true",
  };
}
/** Manual ad-unit ID for a placement (10 digits from AdSense → Ads → By ad unit). */
export function adSlotId(placement: AdPlacement): string | null {
  const id = process.env[slotEnv[placement]] || "";
  return /^\d{10}$/.test(id) ? id : null;
}
