import { createHash } from 'node:crypto';
import { UpstreamError } from './http.js';
export class LastBabeProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    resolvedBaseUrl;
    resolvedExpiresAt = 0;
    resolving;
    async search(query, _quality, _atmos) {
        const body = await this.request('/search', { q: query });
        const tracks = isRecord(body) && Array.isArray(body.tracks) ? body.tracks : [];
        return tracks.filter(isRecord).map(toTrack).filter((track) => track !== null);
    }
    async getStream(trackId, quality, _atmos) {
        const body = await this.request(`/stream/${encodeURIComponent(trackId)}`, { quality });
        if (!isRecord(body) || typeof body.url !== 'string' || !/^https:\/\//i.test(body.url))
            return null;
        return {
            url: body.url,
            format: stringValue(body.format),
            quality: stringValue(body.quality) ?? quality,
            codec: stringValue(body.codec),
            container: stringValue(body.container),
            manifest: body.manifest === 'hls' || body.manifest === 'dash' ? body.manifest : 'none',
            encrypted: body.encrypted === true,
        };
    }
    async request(path, params) {
        const base = await this.resolveBaseUrl();
        const url = new URL(path.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`);
        for (const [key, value] of Object.entries(params))
            url.searchParams.set(key, value);
        let lastError;
        for (let attempt = 0; attempt <= this.config.upstreamRetries; attempt += 1) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
            try {
                const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
                let body;
                try {
                    body = await response.json();
                }
                catch {
                    throw new UpstreamError(502, 'LastBabe returned invalid JSON');
                }
                if (!response.ok) {
                    const error = new UpstreamError(retryable(response.status) ? 502 : response.status === 404 ? 404 : 400, 'LastBabe backend request failed');
                    if (!retryable(response.status) || attempt >= this.config.upstreamRetries)
                        throw error;
                    lastError = error;
                }
                else
                    return body;
            }
            catch (error) {
                if (error instanceof UpstreamError) {
                    if (error.status !== 502 || attempt >= this.config.upstreamRetries)
                        throw error;
                }
                else
                    lastError = error;
            }
            finally {
                clearTimeout(timeout);
            }
            await delay(200 * 2 ** attempt);
        }
        throw lastError instanceof UpstreamError ? lastError : new UpstreamError(502, 'LastBabe backend request failed');
    }
    async resolveBaseUrl() {
        const configured = this.config.lastBabeBaseUrl;
        if (!configured)
            throw new UpstreamError(502, 'LastBabe backend is not configured');
        if (!configured.includes('lastbabe.velixir.run') || /\/e\/[^/]+\/[^/]+/.test(configured))
            return configured.replace(/\/$/, '');
        if (this.resolvedBaseUrl && Date.now() < this.resolvedExpiresAt - 60_000)
            return this.resolvedBaseUrl;
        this.resolving ??= this.mintFreshUrl(configured).finally(() => { this.resolving = undefined; });
        return this.resolving;
    }
    async mintFreshUrl(landingUrl) {
        const root = landingUrl.endsWith('/') ? landingUrl : `${landingUrl}/`;
        const challengeResponse = await fetch(`${root}challenge`, { signal: AbortSignal.timeout(Math.max(this.config.requestTimeoutMs, 15000)) });
        if (!challengeResponse.ok)
            throw new UpstreamError(502, 'LastBabe challenge failed');
        const challenge = await challengeResponse.json();
        if (typeof challenge.challenge !== 'string')
            throw new UpstreamError(502, 'LastBabe challenge was malformed');
        const difficulty = typeof challenge.difficulty === 'number' && challenge.difficulty >= 1 && challenge.difficulty <= 8 ? challenge.difficulty : 4;
        const prefix = '0'.repeat(difficulty);
        let nonce = 0;
        let found;
        while (!found) {
            for (let i = 0; i < 20_000; i += 1) {
                nonce += 1;
                const candidate = String(nonce);
                if (createHash('sha256').update(challenge.challenge + candidate).digest('hex').startsWith(prefix)) {
                    found = candidate;
                    break;
                }
            }
            if (!found)
                await new Promise(resolve => setImmediate(resolve));
        }
        const mintResponse = await fetch(`${root}mint`, {
            method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ challenge: challenge.challenge, nonce: found }),
            signal: AbortSignal.timeout(Math.max(this.config.requestTimeoutMs, 15000)),
        });
        if (!mintResponse.ok)
            throw new UpstreamError(502, 'LastBabe mint failed');
        const minted = await mintResponse.json();
        const manifestUrl = typeof minted.manifestUrl === 'string' ? minted.manifestUrl : typeof minted.addonUrl === 'string' ? minted.addonUrl : undefined;
        if (!manifestUrl || !/^https:\/\//i.test(manifestUrl))
            throw new UpstreamError(502, 'LastBabe mint response was malformed');
        const base = manifestUrl.replace(/\/manifest\.json$/, '').replace(/\/$/, '');
        this.resolvedBaseUrl = base;
        this.resolvedExpiresAt = typeof minted.expiresAt === 'number' ? minted.expiresAt * 1000 : Date.now() + 48 * 60 * 60 * 1000;
        return base;
    }
}
function toTrack(raw) {
    const id = raw.trackId ?? raw.id;
    const title = raw.title;
    if ((typeof id !== 'number' && typeof id !== 'string') || typeof title !== 'string' || !title.trim())
        return null;
    return {
        upstreamId: String(id),
        title: title.trim(),
        artist: typeof raw.artist === 'string' ? raw.artist : Array.isArray(raw.artists) ? raw.artists.filter((x) => typeof x === 'string').join(', ') : undefined,
        album: typeof raw.album === 'string' ? raw.album : undefined,
        duration: typeof raw.duration === 'number' ? raw.duration : undefined,
        artworkURL: typeof raw.artwork === 'string' ? raw.artwork : typeof raw.artworkURL === 'string' ? raw.artworkURL : undefined,
        format: typeof raw.format === 'string' ? raw.format : undefined,
        audioQuality: typeof raw.audioQuality === 'string' ? raw.audioQuality : undefined,
    };
}
function isRecord(value) { return typeof value === 'object' && value !== null; }
function stringValue(value) { return typeof value === 'string' ? value : undefined; }
function retryable(status) { return status === 408 || status === 425 || status === 429 || status >= 500; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
