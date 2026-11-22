# Firebase directory, Render backends, and the website router

Firebase Realtime Database holds private job metadata and the backend ID that owns
each job. Videos remain temporary files on their original backend and are streamed
through the router when the visitor saves them. Firebase does not run yt-dlp,
store videos, prevent service sleeping, or increase a hosting plan's allowance.

## 1. Create Firebase and obtain server credentials

1. In the Firebase console create a project, then **Build → Realtime Database →
   Create database**. Choose locked/production mode. Copy the exact database URL
   (including its regional hostname, if present).
2. Publish the rules in `firebase/database.rules.json` in the database's **Rules**
   tab. Alternatively, use Firebase CLI: `firebase deploy --only database --project
YOUR_PROJECT_ID` from this directory. These rules deny browser access.
3. In **Project settings → Service accounts**, generate a private key. Use a
   service account with Realtime Database administration access in this project.
   Serialize that JSON to one line, keeping the escaped `\n` in its private key.
   This is `FIREBASE_SERVICE_ACCOUNT_JSON`. The regular Firebase web API key is
   insufficient. Do not commit the key file or put it in any `NEXT_PUBLIC_*` value.
4. Generate one long random `FLUX_ROUTER_SECRET` and reuse it on the website router
   and every backend. For example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Authentication uses a short-lived Google OAuth access token generated from the
service account. Tokens are reused until shortly before expiry. No Firebase client
SDK or browser Firebase connection is needed.

## 2. Create the Render backend

Push the committed source to your GitHub repository. In Render choose **New →
Blueprint**, select that repository and its deployment branch, and apply
`render.yaml`. This creates one Docker web service and enables automatic deployment
on subsequent commits to that branch. The repo includes Node, Python, yt-dlp and
FFmpeg in its Dockerfile.

Render prompts for:

| Setting                         | Value                                                  |
| ------------------------------- | ------------------------------------------------------ |
| `FIREBASE_DATABASE_URL`         | Exact Realtime Database URL                            |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Entire private service-account JSON, one line          |
| `FLUX_ROUTER_SECRET`            | Shared random secret from step 1                       |
| `TURNSTILE_SECRET_KEY`          | Optional Turnstile secret; leave empty if not using it |

The initial backend ID is `backend-1`. Copy the service's HTTPS `onrender.com` URL.
The defaults are one concurrent download, 720p maximum, five minutes maximum,
100 MB maximum, and one-hour retention. `/api/health` lets Render check the process.
It returns capacity only to callers with the correct router secret.

Adding configuration to the repository does not create the remote service by
itself: the first Blueprint connection and credentials must be entered in Render.
This repository has not been pushed or connected to an account by this change.

## 3. Enable the Cloudflare website router

In your GitHub repository's **Settings → Secrets and variables → Actions →
Variables**, set `FLUX_ROUTER=true`. If using Turnstile, also set the public
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` there and configure the widget for the website's
domain. The existing Cloudflare workflow uses both during the website build.

In the Cloudflare Worker's **Settings → Variables and Secrets**, add these encrypted
server secrets before deploying the router:

| Setting                         | Value                                               |
| ------------------------------- | --------------------------------------------------- |
| `FIREBASE_DATABASE_URL`         | Same database URL                                   |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Same service-account JSON                           |
| `FLUX_ROUTER_SECRET`            | Same secret as the backend                          |
| `FLUX_BACKENDS`                 | `{"backend-1":"https://YOUR-SERVICE.onrender.com"}` |

Set `FLUX_ROUTER=true` at runtime too. The GitHub deployment workflow sets this
runtime flag from the repository variable and preserves dashboard variables.
For a manual deployment, set `FLUX_ROUTER=true` in the build environment and deploy
with `npx wrangler deploy --keep-vars --var FLUX_ROUTER:true` after `npm run cf:build`.
Keep `FLUX_HOSTED` unset on the Cloudflare website and remove any old
`NEXT_PUBLIC_FLUX_API` value; requests now use the website's own `/api` routes.

Do not send Firebase credentials to the browser. Visitors retain only their own
recent job IDs in browser local storage; no video data is kept in cookies.

## Adding another backend

Provision another service under your host's permitted usage, set a unique stable
`FLUX_BACKEND_ID` such as `backend-2`, and give it the same Firebase credentials,
router secret, and download limits. Add its ID and HTTPS origin to `FLUX_BACKENDS`:

```json
{
  "backend-1": "https://FIRST.onrender.com",
  "backend-2": "https://SECOND.onrender.com"
}
```

The router probes capacity only when an inspection or new download arrives, picks
the least loaded responsive backend, and uses Firebase to send all later status
and file requests to the job's owner. There are no scheduled keep-alive pings or
Firebase polling connections. A server at capacity rejects extra work; this is
not a durable queue. An ambiguous failed download POST is never automatically
replayed, to avoid starting duplicate downloads.

## Operational limits and verification

- A sleeping service may take longer to wake than the five-second capacity probe.
  The visitor gets a retry message; a later request can succeed once it wakes.
  If every backend sleeps, a balancer cannot eliminate the initial wait.
- Existing jobs cannot fail over to another backend: its local file is only on
  the owner. A backend restart can lose files on ephemeral Render storage. Those
  jobs return an expired/missing response and the visitor must retry.
- Completed files and their Firebase records are pruned when a later download
  triggers the retention cleanup. Expired records requested through the router
  are also deleted. Realtime Database has no TTL configured here; records left
  by a vanished backend need periodic administrative cleanup under `/flux/jobs`.
- Rate limits are enforced at the website router and each backend in memory.
  They are not a distributed global quota across multiple router instances.
- Streamed video traffic still consumes backend bandwidth and must fit your
  hosting/CDN terms and quotas. Adding backends does not increase free allowances
  within an account or authorize bypassing provider limits.

After configuring real accounts, open the website, inspect a permitted public
video, download it, refresh the page, and save the file. Check Firebase
`/flux/jobs/<id>`: it should contain status, backend ID and expiry, with no local
file path or source URL. Verify direct backend API calls without the router
secret are refused. Test each backend, sleeping/waking, expiry, and a restart.
Local automated tests mock Firebase and Render; they do not verify credentials
or establish live platform availability from Render's network.

References: [Firebase REST authentication](https://firebase.google.com/docs/database/rest/auth),
[Render Blueprints](https://render.com/docs/blueprint-spec),
[Render free service limits](https://render.com/docs/free).
