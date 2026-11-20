import { afterEach, expect, it, vi } from "vitest";
import { adsConfig } from "../src/lib/ads";
import { GET as adsTxt } from "../src/app/ads.txt/route";
import { GET as llm } from "../src/app/llm.txt/route";
afterEach(() => vi.unstubAllEnvs());
it("does not enable advertising with missing or placeholder IDs", async () => {
  vi.stubEnv("ADSENSE_ENABLED", "true");
  vi.stubEnv("ADSENSE_CONSENT_READY", "true");
  for (const id of ["", "ca-pub-0000000000000000", "invalid"]) {
    vi.stubEnv("ADSENSE_CLIENT_ID", id);
    expect(adsConfig().enabled).toBe(false);
    expect(await adsTxt().text()).not.toContain("DIRECT");
  }
});
it("requires explicit enablement and consent readiness and publishes a valid seller record", async () => {
  vi.stubEnv("ADSENSE_CLIENT_ID", "ca-pub-1234567890123456");
  vi.stubEnv("ADSENSE_ENABLED", "false");
  vi.stubEnv("ADSENSE_CONSENT_READY", "false");
  expect(adsConfig().enabled).toBe(false);
  vi.stubEnv("ADSENSE_ENABLED", "true");
  expect(adsConfig().enabled).toBe(false);
  vi.stubEnv("ADSENSE_CONSENT_READY", "true");
  expect(adsConfig().enabled).toBe(true);
  expect(await adsTxt().text()).toBe(
    "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
  );
});
it("redirects the requested singular file to the conventional plural path", () => {
  const response = llm(new Request("http://localhost:3000/llm.txt"));
  expect(response.status).toBe(308);
  expect(response.headers.get("location")).toBe(
    "http://localhost:3000/llms.txt",
  );
});
it("accepts only 10-digit manual ad-unit IDs per placement", async () => {
  const { adSlotId } = await import("../src/lib/ads");
  vi.stubEnv("ADSENSE_SLOT_HOME", "1234567890");
  vi.stubEnv("ADSENSE_SLOT_CONTENT", "12345");
  expect(adSlotId("home")).toBe("1234567890");
  expect(adSlotId("content")).toBeNull();
});
it("turns on reserved-space preview only when explicitly requested", () => {
  vi.stubEnv("ADSENSE_PREVIEW", "");
  expect(adsConfig().preview).toBe(false);
  vi.stubEnv("ADSENSE_PREVIEW", "true");
  expect(adsConfig().preview).toBe(true);
});
