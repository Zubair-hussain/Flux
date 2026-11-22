import { generateKeyPairSync, verify } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { firebaseEnabled, firebaseJob, publishJob } from "../src/lib/firebase";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const id = "12345678-1234-1234-1234-123456789abc";
const job = {
  id,
  title: "Example",
  platform: "YouTube",
  quality: 720 as const,
  status: "queued" as const,
  createdAt: new Date().toISOString(),
  file: "/private/download/video.mp4",
};
const fetcher = vi.fn();
let version = 0;
beforeEach(() => {
  vi.stubEnv(
    "FIREBASE_DATABASE_URL",
    "https://example-default-rtdb.firebaseio.com",
  );
  vi.stubEnv(
    "FIREBASE_SERVICE_ACCOUNT_JSON",
    JSON.stringify({
      client_email: "service@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      version: version++,
    }),
  );
  vi.stubEnv("FLUX_BACKEND_ID", "backend-1");
  fetcher
    .mockReset()
    .mockImplementation(async (url) =>
      Response.json(
        String(url).includes("oauth2.googleapis.com")
          ? { access_token: "test-token", expires_in: 3600 }
          : null,
      ),
    );
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("signs a valid scoped JWT and reuses its short-lived token", async () => {
  await Promise.all([firebaseJob(id), firebaseJob(id)]);
  expect(
    fetcher.mock.calls.filter(([url]) => String(url).includes("oauth2")),
  ).toHaveLength(1);
  const assertion = fetcher.mock.calls[0][1].body.get("assertion") as string;
  const [header, payload, signature] = assertion.split(".");
  expect(
    verify(
      "RSA-SHA256",
      Buffer.from(`${header}.${payload}`),
      publicKey,
      Buffer.from(signature, "base64url"),
    ),
  ).toBe(true);
  expect(
    JSON.parse(Buffer.from(payload, "base64url").toString()).scope,
  ).toContain("firebase.database");
  const [url, init] = fetcher.mock.calls[1];
  expect(String(url)).toBe(
    `https://example-default-rtdb.firebaseio.com/flux/jobs/${id}.json`,
  );
  expect(init.headers.Authorization).toBe("Bearer test-token");
  expect(init.redirect).toBe("manual");
  expect(String(url)).not.toContain("test-token");
});

it("publishes metadata and owner without leaking a filesystem path", async () => {
  vi.stubEnv("FLUX_RETENTION_HOURS", "2");
  await publishJob(job);
  const init = fetcher.mock.calls[1][1];
  expect(init.method).toBe("PUT");
  const body = JSON.parse(init.body);
  expect(body).toMatchObject({ id, backendId: "backend-1", status: "queued" });
  expect(body.file).toBeUndefined();
  expect(body.expiresAt).toBe(Date.parse(job.createdAt) + 7_200_000);
});

it("does nothing without Firebase but rejects partial configuration", async () => {
  vi.stubEnv("FIREBASE_DATABASE_URL", "");
  vi.stubEnv("FIREBASE_SERVICE_ACCOUNT_JSON", "");
  expect(firebaseEnabled()).toBe(false);
  await publishJob(job);
  expect(fetcher).not.toHaveBeenCalled();
  vi.stubEnv("FIREBASE_DATABASE_URL", "https://example.firebaseio.com");
  expect(firebaseEnabled()).toBe(true);
  await expect(firebaseJob(id)).rejects.toMatchObject({ status: 503 });
});

it.each([
  "https://evil.test",
  "http://example.firebaseio.com",
  "https://example.firebaseio.com/path",
  "https://user:pass@example.firebaseio.com",
])(
  "rejects invalid database origin %s before sending credentials",
  async (url) => {
    vi.stubEnv("FIREBASE_DATABASE_URL", url);
    await expect(firebaseJob(id)).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  },
);

it("validates job IDs and backend IDs", async () => {
  await expect(firebaseJob("../other")).rejects.toMatchObject({ status: 404 });
  vi.stubEnv("FLUX_BACKEND_ID", "bad/id");
  await expect(publishJob(job)).rejects.toMatchObject({ status: 503 });
});

it("deletes records and supports regional database URLs", async () => {
  vi.stubEnv(
    "FIREBASE_DATABASE_URL",
    "https://example.europe-west1.firebasedatabase.app",
  );
  await firebaseJob(id, "DELETE");
  expect(fetcher.mock.calls[1][1].method).toBe("DELETE");
});

it.each(["token", "database", "invalid token", "network"])(
  "handles %s errors without exposing credentials",
  async (failure) => {
    fetcher.mockImplementation(async (url) => {
      if (failure === "network") throw new Error("private key secret");
      if (String(url).includes("oauth2"))
        return failure === "token"
          ? new Response("private secret", { status: 401 })
          : Response.json(
              failure === "invalid token"
                ? {}
                : { access_token: "test", expires_in: 3600 },
            );
      return new Response("private secret", { status: 403 });
    });
    await expect(firebaseJob(id)).rejects.toMatchObject({
      status: 503,
      message: expect.not.stringContaining("secret"),
    });
  },
);
