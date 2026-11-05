import { UpstreamError } from './http.js';
/** Adapter for the public Qobuz-DL-compatible JSON API. */
export class QobuzDlProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async search(query, _quality, _atmos) {
        const body = await this.request('/api/get-music', { q: query, offset: '0' });
        const data = isRecord(body) && isRecord(body.data) ? body.data : undefined;
        const tracks = data && isRecord(data.tracks) && Array.isArray(data.tracks.items) ? data.tracks.items : [];
        return tracks.filter(isRecord).map(toTrack).filter((track) => track !== null);
    }
    async getStream(trackId, quality, _atmos) {
        const body = await this.request('/api/download-music', { track_id: trackId, quality: qualityId(quality) });
        const data = isRecord(body) && isRecord(body.data) ? body.data : undefined;
        const url = data && typeof data.url === 'string' ? data.url : undefined;
        if (!url || !/^https:\/\//i.test(url))
            return null;
        // The upstream endpoint returns only a URL. Do not infer codec, bitrate,
        // bit depth, Dolby, or encryption metadata that it did not provide.
        return { url, manifest: 'none', encrypted: false };
    }
    async request(path, params) {
        const url = new URL(path, this.config.apiBaseUrl);
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
                    throw new UpstreamError(502, 'Qobuz-DL provider returned invalid JSON');
                }
                if (!response.ok) {
                    const error = new UpstreamError(retryableStatus(response.status) ? 502 : response.status === 404 ? 404 : 400, upstreamMessage(body));
                    if (!retryableStatus(response.status) || attempt >= this.config.upstreamRetries)
                        throw error;
                    lastError = error;
                }
                else if (isRecord(body) && body.success === false) {
                    const error = new UpstreamError(502, upstreamMessage(body));
                    if (attempt >= this.config.upstreamRetries)
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
                lastError = error;
            }
            finally {
                clearTimeout(timeout);
            }
            await delay(200 * 2 ** attempt);
        }
        throw lastError instanceof UpstreamError ? lastError : new UpstreamError(502, 'Qobuz-DL provider request failed');
    }
}
function retryableStatus(status) { return status === 408 || status === 425 || status === 429 || status >= 500; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function qualityId(quality) {
    // IDs verified from the Qobuz-DL route schema: 27, 7, 6, and 5.
    // Lossless uses the app default; HIGH/LOW use its MP3 rendition because
    // this public endpoint exposes no separate low-bitrate contract.
    if (quality === 'LOSSLESS')
        return '27';
    return '5';
}
function toTrack(raw) {
    const id = raw.id;
    const title = raw.title;
    if ((typeof id !== 'number' && typeof id !== 'string') || typeof title !== 'string' || !title.trim())
        return null;
    const album = isRecord(raw.album) ? raw.album : undefined;
    const performer = isRecord(raw.performer) ? raw.performer : undefined;
    const image = album && isRecord(album.image) ? album.image : undefined;
    const artworkURL = image && typeof image.large === 'string' ? image.large : undefined;
    const maxBitDepth = typeof raw.maximum_bit_depth === 'number' ? raw.maximum_bit_depth : undefined;
    return {
        upstreamId: String(id), title: title.trim(),
        artist: performer && typeof performer.name === 'string' ? performer.name : undefined,
        album: album && typeof album.title === 'string' ? album.title : undefined,
        duration: typeof raw.duration === 'number' ? raw.duration : undefined,
        artworkURL, format: maxBitDepth ? 'flac' : undefined,
        audioQuality: maxBitDepth ? 'LOSSLESS' : undefined,
    };
}
function isRecord(value) { return typeof value === 'object' && value !== null; }
function upstreamMessage(body) {
    if (isRecord(body) && typeof body.error === 'string')
        return `Qobuz-DL upstream error: ${body.error}`;
    return 'Qobuz-DL upstream request failed';
}
