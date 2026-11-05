export class UpstreamError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
/**
 * Adapter for an authorized, documented JSON provider. Endpoint paths are
 * explicit configuration; this class does not guess or scrape routes.
 * Expected search JSON: { tracks: QobuzTrack[] } or QobuzTrack[].
 * Expected stream JSON: QobuzStream.
 */
export class HttpQobuzProvider {
    config;
    constructor(config) {
        this.config = config;
        if (!config.apiBaseUrl || !config.searchPath || !config.streamPath)
            throw new Error('HTTP provider requires QOBUZ_API_BASE_URL, QOBUZ_SEARCH_PATH, and QOBUZ_STREAM_PATH');
    }
    async search(query, quality, atmos) {
        const body = await this.request(this.config.searchPath, { q: query, quality, atmos });
        const raw = Array.isArray(body) ? body : body.tracks;
        if (!Array.isArray(raw))
            throw new UpstreamError(502, 'provider search response is malformed');
        return raw.filter(isTrack);
    }
    async getStream(trackId, quality, atmos) {
        const path = this.config.streamPath.replace('{id}', encodeURIComponent(trackId));
        const body = await this.request(path, { quality, atmos });
        return isStream(body) ? body : null;
    }
    async request(path, params) {
        const url = new URL(path, this.config.apiBaseUrl);
        for (const [key, value] of Object.entries(params))
            url.searchParams.set(key, value);
        const headers = { accept: 'application/json' };
        if (this.config.apiToken)
            headers.authorization = `Bearer ${this.config.apiToken}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
        try {
            const response = await fetch(url, { headers, signal: controller.signal });
            if (response.status === 404)
                throw new UpstreamError(404, 'provider track not found');
            if (response.status === 429)
                throw new UpstreamError(503, 'provider rate limited');
            if (!response.ok)
                throw new UpstreamError(502, `provider returned HTTP ${response.status}`);
            try {
                return await response.json();
            }
            catch {
                throw new UpstreamError(502, 'provider returned invalid JSON');
            }
        }
        catch (error) {
            if (error instanceof UpstreamError)
                throw error;
            throw new UpstreamError(502, 'provider request failed');
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
function isRecord(value) { return typeof value === 'object' && value !== null; }
function isTrack(value) {
    return isRecord(value) && typeof value.upstreamId === 'string' && typeof value.title === 'string';
}
function isStream(value) {
    return isRecord(value) && typeof value.url === 'string' && /^https:\/\//i.test(value.url);
}
