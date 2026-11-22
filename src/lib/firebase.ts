import { createSign } from "node:crypto";
import { AppError } from "./policy";
import type { Job } from "./types";

type SharedJob = Omit<Job, "file"> & { backendId: string; expiresAt: number };
let cached: { key: string; token: string; expires: number } | undefined;
let pending: Promise<string> | undefined;

export function firebaseEnabled() {
  return Boolean(
    process.env.FIREBASE_DATABASE_URL ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  );
}

function configuration() {
  try {
    const url = new URL(process.env.FIREBASE_DATABASE_URL || "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !/\.(firebaseio\.com|firebasedatabase\.app)$/.test(url.hostname) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "");
    if (
      typeof account.client_email !== "string" ||
      typeof account.private_key !== "string"
    )
      throw new Error();
    return { url, account };
  } catch {
    throw new AppError(
      "Firebase server configuration is incomplete or invalid.",
      503,
    );
  }
}

async function accessToken() {
  const { account } = configuration();
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_JSON!;
  if (cached?.key === key && cached.expires > Date.now() + 60_000)
    return cached.token;
  if (pending) return pending;
  pending = (async () => {
    const now = Math.floor(Date.now() / 1000);
    const encode = (data: unknown) =>
      Buffer.from(JSON.stringify(data)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
      iss: account.client_email,
      scope:
        "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256")
      .update(unsigned)
      .sign(account.private_key, "base64url");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Token exchange failed");
    const data = await response.json();
    if (typeof data.access_token !== "string" || !(Number(data.expires_in) > 0))
      throw new Error("Invalid token response");
    cached = {
      key,
      token: data.access_token,
      expires: Date.now() + Number(data.expires_in) * 1000,
    };
    return cached.token;
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}

export async function firebaseJob(
  id: string,
  method: "GET" | "PUT" | "DELETE" = "GET",
  value?: SharedJob,
): Promise<SharedJob | null> {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new AppError("Download not found.", 404);
  const { url } = configuration();
  try {
    const response = await fetch(new URL(`/flux/jobs/${id}.json`, url), {
      method,
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json",
      },
      ...(method === "PUT" ? { body: JSON.stringify(value) } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Database request failed");
    return await response.json();
  } catch {
    throw new AppError(
      "The download directory is temporarily unavailable. Please retry.",
      503,
    );
  }
}

export async function publishJob(job: Job) {
  if (!firebaseEnabled()) return;
  const backendId = process.env.FLUX_BACKEND_ID;
  if (!backendId || !/^[a-zA-Z0-9_-]{1,64}$/.test(backendId))
    throw new AppError("Set a valid FLUX_BACKEND_ID for this server.", 503);
  const { file: _file, ...metadata } = job;
  // Shared records contain no filesystem path, source URL, or visitor address.
  const hours = Number(process.env.FLUX_RETENTION_HOURS || 1);
  await firebaseJob(job.id, "PUT", {
    ...metadata,
    backendId,
    expiresAt: Date.parse(job.createdAt) + (hours > 0 ? hours : 1) * 3_600_000,
  });
}
