import { UpstreamError } from './http.js';
export class MonochromeProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async search(query, _quality, _atmos) {
        const body = await this.request('/search/tracks', { q: query, limit: '10' });
        const items = isRecord(body) && Array.isArray(body.tracks) ? body.tracks : [];
        return items.filter(isRecord).map(toTrack).filter((track) => track !== null);
    }
    async getStream(trackId, _quality, _atmos) {
        if (!/^[A-Za-z0-9_-]+$/.test(trackId))
            return null;
        return {
            url: new URL(`/track/${encodeURIComponent(trackId)}`, this.baseUrl()).toString(),
            format: 'flac', quality: 'LOSSLESS', manifest: 'none', encrypted: false,
        };
    }
    baseUrl() { return this.config.monochromeBaseUrl ?? 'https://tracks.monochrome.st'; }
    async request(path, params) {
        const url = new URL(path, this.baseUrl());
        for (const [key, value] of Object.entries(params))
            url.searchParams.set(key, value);
        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), Math.max(this.config.requestTimeoutMs, 10000));
            try {
                const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
                let body;
                try {
                    body = await response.json();
                }
                catch {
                    throw new UpstreamError(502, 'Monochrome returned invalid JSON');
                }
                if (!response.ok)
                    throw new UpstreamError(response.status >= 500 ? 502 : response.status, 'Monochrome request failed');
                return body;
            }
            catch (error) {
                lastError = error;
                if (error instanceof UpstreamError && error.status < 500)
                    throw error;
                if (attempt === 0)
                    await new Promise((resolve) => setTimeout(resolve, 200));
            }
            finally {
                clearTimeout(timeout);
            }
        }
        if (lastError instanceof UpstreamError)
            throw lastError;
        throw new UpstreamError(502, 'Monochrome request failed');
    }
}
function toTrack(raw) {
    const id = raw.id ?? raw.trackId;
    const title = raw.title;
    if ((typeof id !== 'number' && typeof id !== 'string') || typeof title !== 'string' || !title.trim())
        return null;
    const artists = Array.isArray(raw.artistNames) ? raw.artistNames.filter((v) => typeof v === 'string') : [];
    const duration = typeof raw.duration === 'number' ? Math.round(raw.duration / 1000) : undefined;
    return {
        upstreamId: String(id), title: title.trim(), artist: artists.join(', ') || undefined,
        artworkURL: typeof raw.artwork === 'string' ? raw.artwork : undefined,
        duration, format: 'flac', audioQuality: 'LOSSLESS',
    };
}
function isRecord(value) { return typeof value === 'object' && value !== null; }
