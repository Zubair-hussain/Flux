import Script from "next/script";
import { adsConfig, adSlotId, type AdPlacement } from "@/lib/ads";
import { AdPush } from "@/components/ad-push";

export function AdSense() {
  const { enabled, client } = adsConfig();
  if (!enabled) return null;
  return (
    <Script
      id="flux-adsense"
      async
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}

/**
 * A fixed-height ad position kept away from the URL field and download buttons.
 * - Ads live + slot ID configured: renders a responsive AdSense unit.
 * - ADSENSE_PREVIEW=true: renders an empty labelled box so the layout can be
 *   reviewed before approval (no Google request is made).
 * - Otherwise: renders nothing, so visitors never see empty boxes.
 */
export function AdSlot({ placement }: { placement: AdPlacement }) {
  const { enabled, client, preview } = adsConfig();
  const slot = adSlotId(placement);
  if (enabled && client && slot) {
    return (
      <aside
        className="ad-slot"
        aria-label="Advertisement"
        data-placement={placement}
      >
        <span className="ad-label">Advertisement</span>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <AdPush />
      </aside>
    );
  }
  if (preview && !enabled) {
    return (
      <aside
        className="ad-slot ad-slot-preview"
        aria-label="Reserved advertising space"
        data-placement={placement}
      >
        <span className="ad-label">Advertisement</span>
        <div className="ad-placeholder">
          Ad space reserved · {placement}
          <small>Preview only. Set ADSENSE_PREVIEW=false to hide.</small>
        </div>
      </aside>
    );
  }
  return null;
}
