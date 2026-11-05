export class TtlCache {
    ttlMs;
    maxEntries;
    values = new Map();
    constructor(ttlMs, maxEntries = 100) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
    }
    get(key) {
        const hit = this.values.get(key);
        if (!hit)
            return undefined;
        if (hit.expiresAt <= Date.now())
            return undefined;
        return hit.value;
    }
    getStale(key) {
        return this.values.get(key)?.value;
    }
    set(key, value) {
        if (this.values.size >= this.maxEntries && !this.values.has(key))
            this.values.delete(this.values.keys().next().value);
        this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }
}
