import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AsyncCache } from "../src/lib/async-cache";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => vi.useRealTimers());

it("coalesces concurrent loads and protects cached results from mutation", async () => {
  const cache = new AsyncCache<{ values: number[] }>(1000, 2);
  const load = vi.fn(async () => ({ values: [1] }));
  const [first, second] = await Promise.all([
    cache.get("a", load),
    cache.get("a", load),
  ]);
  first.values.push(2);
  expect(second.values).toEqual([1]);
  expect((await cache.get("a", load)).values).toEqual([1]);
  expect(load).toHaveBeenCalledTimes(1);
});
it("expires successful results and never caches failed loads", async () => {
  const cache = new AsyncCache<number>(1000, 2);
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error("temporary"))
    .mockResolvedValue(42);
  await expect(cache.get("a", load)).rejects.toThrow("temporary");
  expect(await cache.get("a", load)).toBe(42);
  vi.setSystemTime(1001);
  expect(await cache.get("a", load)).toBe(42);
  expect(load).toHaveBeenCalledTimes(3);
});
it("bounds retained entries and removes expired entries on insertion", async () => {
  const cache = new AsyncCache<number>(1000, 2);
  const load = vi.fn(async () => 1);
  await cache.get("a", load);
  await cache.get("b", load);
  await cache.get("c", load);
  await cache.get("a", load);
  expect(load).toHaveBeenCalledTimes(4);
  vi.setSystemTime(1001);
  await cache.get("d", load);
  await cache.get("c", load);
  expect(load).toHaveBeenCalledTimes(6);
});
it("does not let a stale in-flight load repopulate an invalidated cache", async () => {
  const cache = new AsyncCache<number>(1000, 2);
  let resolve!: (value: number) => void;
  const pending = cache.get(
    "a",
    () =>
      new Promise<number>((done) => {
        resolve = done;
      }),
  );
  await Promise.resolve();
  cache.clear();
  expect(await cache.get("a", async () => 2)).toBe(2);
  resolve(1);
  expect(await pending).toBe(1);
  expect(await cache.get("a", async () => 3)).toBe(2);
});
