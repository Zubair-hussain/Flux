/** Small process-local cache. Failed loads are never retained. */
export class AsyncCache<T> {
  private entries = new Map<string, { value: T; expiresAt: number }>();
  private pending = new Map<string, Promise<T>>();

  constructor(
    private ttlMs: number,
    private maxEntries: number,
  ) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > Date.now())
      return structuredClone(cached.value);
    this.entries.delete(key);
    let pending = this.pending.get(key);
    if (!pending) {
      pending = Promise.resolve().then(load);
      this.pending.set(key, pending);
      const current = pending;
      // Attach both handlers immediately so failed background loads cannot reject unobserved.
      void pending.then(
        (value) => {
          if (this.pending.get(key) !== current) return;
          this.pending.delete(key);
          const now = Date.now();
          for (const [name, entry] of this.entries)
            if (entry.expiresAt <= now) this.entries.delete(name);
          if (this.entries.size >= this.maxEntries)
            this.entries.delete(this.entries.keys().next().value!);
          this.entries.set(key, {
            value: structuredClone(value),
            expiresAt: now + this.ttlMs,
          });
        },
        () => {
          if (this.pending.get(key) === current) this.pending.delete(key);
        },
      );
    }
    return structuredClone(await pending);
  }

  clear() {
    this.entries.clear();
    this.pending.clear();
  }
}
