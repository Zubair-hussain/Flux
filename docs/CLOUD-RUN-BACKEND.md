# Third download backend on Google Cloud Run

A free-tier server that runs the same Flux image as your Render backends and sleeps when nobody uses it.

## Steps

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`.
2. In the [Google Cloud console](https://console.cloud.google.com) create a project and attach billing (a card is required). Then open **Billing, Budgets & alerts** and set a small budget (for example $5) with an email alert.
3. Deploy, from the repository folder:

   ```powershell
   .\cloudrun\deploy.ps1 -Project YOUR_PROJECT_ID -EnvFile C:\path\to\flux-render-backend-1.env
   ```

   The env file holds the same `FLUX_ROUTER_SECRET`, `FIREBASE_DATABASE_URL` and `FIREBASE_SERVICE_ACCOUNT_JSON` as your other backends. The script puts them in Google Secret Manager. It prints the new address when it finishes.

4. Add the printed line to `FLUX_BACKENDS` in `wrangler.jsonc`, next to `backend-1` and `backend-2`, and redeploy the website. The router then balances across all three.

## How it is set up

- **One instance at most.** A download's file lives on the instance that created it, so a second instance would not find it.
- **Sleeps when idle.** It costs nothing while asleep. Files on it disappear when it sleeps (after roughly 15 idle minutes), so a visitor who returns later downloads again.
- **CPU always on while awake.** Downloads continue after the first response, so CPU must not be throttled between requests. Google's free allowance for this mode is smaller than for the default mode (about 240,000 vCPU-seconds a month, as I last knew it). **Check Google's current free-tier page before relying on it.**
- **Same limits as Render:** 720p, 5 minutes, 100 MB, one download at a time.

## Limits to know

- Cloud Run's disk is memory, so the 100 MB cap matters. Do not raise it without raising memory.
- Google's data-centre addresses are probably blocked by YouTube and Dailymotion like Render's. Not tested from Google.
- Beyond the free allowance you pay per use. Keep the budget alert on.
- The script has not been run against a real Google account, so check its output the first time.
