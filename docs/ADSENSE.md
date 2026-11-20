# Google AdSense configuration

This integration is for displaying Google AdSense Auto ads. It does not create paid Google Ads campaigns or add conversion tracking. Ads remain disabled by default. No publisher account or approval is fabricated.

1. Apply for AdSense and add the real public domain to your account. Follow the verification method offered by AdSense. Localhost and the placeholder preview are not a production advertising site.
2. Put your actual `ca-pub-` ID (16 digits) in `ADSENSE_CLIENT_ID` in the deployment environment. `/ads.txt` then publishes the corresponding `pub-` seller record, even while script loading is disabled. Compare it with the exact record shown in your AdSense dashboard. With no valid ID it returns only an explanatory comment.
3. Configure and publish the required consent messages/CMP for your audience. Google requires a certified TCF CMP for ads served in the EEA, UK, and Switzerland. Configure this in AdSense Privacy & messaging or your certified provider and verify real visitor choices before launch. `ADSENSE_CONSENT_READY` is only an operator acknowledgement; it does not collect consent, install a CMP, or replace consent handling.
4. Complete privacy/cookie disclosures for the actual deployment and provider. Do not claim that the site is free of tracking when advertising is active.
5. After site approval and consent configuration, set `ADSENSE_ENABLED=true` and `ADSENSE_CONSENT_READY=true`, enable Auto ads in AdSense, and rebuild/restart. The Google script loads during browser idle time. Invalid or placeholder IDs never load it.
6. Use AdSense preview/exclusions to keep ads away from URL fields and download/save buttons. Do not style ads as download controls, encourage ad clicks, or click your own ads. Verify pages and consent behavior on mobile before enabling monetization.

## Reserved ad positions

Two manual positions are built in. Both sit **below** the download tools, never beside the URL field or the Find/Download/Save buttons, and each keeps a fixed minimum height (280 px desktop, 300 px mobile) so ads loading late do not shift the page (CLS).

| Placement | Where                                                                    | Environment variable   |
| --------- | ------------------------------------------------------------------------ | ---------------------- |
| `home`    | Homepage, after the feature cards and before the “How to download” guide | `ADSENSE_SLOT_HOME`    |
| `content` | End of the blog and every policy/about page, before the footer links     | `ADSENSE_SLOT_CONTENT` |

Each slot value is the 10-digit ad-unit ID from **AdSense → Ads → By ad unit → Display ads**. Each slot renders one of three states:

| State                                                                                                 | What renders                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Ads enabled (`ADSENSE_ENABLED` + `ADSENSE_CONSENT_READY` = `true`, valid client ID) **and** a slot ID | A labelled “Advertisement” responsive unit                                                                    |
| `ADSENSE_PREVIEW=true` while ads are disabled                                                         | An empty, striped “Ad space reserved” box so you can check layouts before approval. No request goes to Google |
| Anything else                                                                                         | Nothing, so visitors never see empty boxes                                                                    |

Without slot IDs, ads that are enabled still run as Auto ads through the global script. Use AdSense's Auto ads settings to exclude areas if needed.

When ads are enabled, the build adds Google's ad and consent hosts to the Content-Security-Policy (`next.config.ts`). The policy stays first-party-only while ads are off. Rebuild after any change to these variables, because headers are fixed at build time.

To disable scripts, set `ADSENSE_ENABLED=false` and rebuild/restart. Script approval, ad delivery, revenue, and policy compliance depend on your actual account and deployment; none is verified by the local tests. Tests must mock ad networks rather than request live ads.

References checked 20 November 2026:

- https://support.google.com/adsense/answer/9261307
- https://support.google.com/adsense/answer/9274634
- https://support.google.com/adsense/answer/13554116
- https://support.google.com/adsense/answer/7670013

The proposed `llms.txt` convention is an informational discovery file (https://llmstxt.org/), not a Google/Bing ranking feature or a permission override. The requested singular `/llm.txt` path redirects to the conventional plural name.
