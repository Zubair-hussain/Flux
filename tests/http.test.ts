import { expect, it } from "vitest";
import { failure, guard } from "../src/lib/http";
import { AppError } from "../src/lib/policy";
it("permits local requests and extension origins", () => {
  for (const origin of [
    undefined,
    "http://localhost:3000",
    `chrome-extension://${"a".repeat(32)}`,
  ])
    expect(() =>
      guard(
        new Request("http://localhost:3000/api/inspect", {
          headers: origin ? { origin } : {},
        }),
      ),
    ).not.toThrow();
});
it("blocks remote hosts and foreign websites", () => {
  expect(() => guard(new Request("https://example.com/api/inspect"))).toThrow(
    "local-only",
  );
  expect(() =>
    guard(
      new Request("http://localhost:3000", {
        headers: { origin: "https://evil.test" },
      }),
    ),
  ).toThrow("Cross-origin");
});
it("returns controlled errors without exposing internals", async () => {
  expect(failure(new AppError("Blocked", 403)).status).toBe(403);
  expect(await failure(new Error("secret path")).json()).toEqual({
    error: "An unexpected error occurred. Please retry.",
  });
});
