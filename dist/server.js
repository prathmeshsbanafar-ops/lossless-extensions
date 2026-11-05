import { createServer, } from "node:http";
import { loadConfig } from "./config.js";
import { homePage } from "./home.js";
import { TtlCache } from "./cache.js";
import { AppError, badRequest, notFound } from "./errors.js";
import { normalizeTrack, streamResponse, upstreamIdFromPublicId, } from "./normalize.js";
import { createProvider, createSourceProvider } from "./providers/index.js";
const config = loadConfig();
const routes = [];
const get = (pattern, handler) => {
    routes.push({ method: "GET", pattern, handler });
};
const manifests = {
    root: { id: "com.echomusic.lossless", name: "Lossless", version: "1.0.0" },
    qobuzdl: {
        id: "com.EchoMusic.qobuz.qobuzdl",
        name: "Qobuz-DL",
        version: "1.0.0",
    },
    lastbabe: {
        id: "com.EchoMusic.qobuz.lastbabe",
        name: "LastBabe",
        version: "1.0.0",
    },
    monochrome: {
        id: "com.EchoMusic.qobuz.monochrome",
        name: "Monochrome Lossless",
        version: "1.0.0",
    },
    deezer: {
        id: "com.EchoMusic.qobuz.deezer",
        name: "Deezer Fallback",
        version: "1.0.0",
    },
    eljohnzc: {
        id: "com.EchoMusic.qobuz.eljohnzc",
        name: "Eljohnzc Lossless",
        version: "1.0.0",
    },
    instable: {
        id: "com.EchoMusic.qobuz.instable",
        name: "Instable Lossless",
        version: "1.0.0",
    },
};
get(/^\/$/, async (_q, _p, send) => send(200, homePage, { "Content-Type": "text/html; charset=utf-8" }));
get(/^\/health$/, async (_q, _p, send) => send(200, { ok: true }));
registerAddon("", createProvider(config), manifests.root);
registerAddon("/a", createSourceProvider(config, "qobuzdl"), manifests.qobuzdl);
registerAddon("/b", createSourceProvider(config, "lastbabe"), manifests.lastbabe);
registerAddon("/c", createSourceProvider(config, "monochrome"), manifests.monochrome);
registerAddon("/d", createSourceProvider(config, "deezer"), manifests.deezer);
registerAddon("/e", createSourceProvider(config, "eljohnzc"), manifests.eljohnzc);
registerAddon("/f", createSourceProvider(config, "instable"), manifests.instable);
function registerAddon(prefix, provider, manifest) {
    const searchCache = new TtlCache(config.cacheTtlMs);
    get(new RegExp(`^${prefix}/manifest\\.json$`), async (_q, _p, send) => send(200, {
        ...manifest,
        resources: ["search", "stream"],
        allowDownloads: 0,
        settings: [
            {
                key: "quality",
                type: "select",
                default: "lossless",
                options: [
                    { label: "Lossless", value: "lossless" },
                    { label: "High", value: "high" },
                    { label: "Low", value: "low" },
                ],
            },
        ],
    }, { "Cache-Control": "public, max-age=3600, s-maxage=86400" }));
    get(new RegExp(`^${prefix}/search$`), async (params, _p, send) => {
        const query = params.get("q")?.trim();
        if (!query)
            throw badRequest("q is required");
        const quality = parseQuality(params.get("quality") ?? undefined);
        const atmos = params.get("atmos") ?? "auto";
        const key = `${query}\u0000${quality}\u0000${atmos}`;
        const cached = searchCache.get(key);
        if (cached)
            return send(200, { tracks: cached }, {
                "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600",
            });
        try {
            const tracks = (await provider.search(query, quality, atmos)).flatMap((track) => {
                try {
                    return [normalizeTrack(track, config.idSecret)];
                }
                catch {
                    return [];
                }
            });
            searchCache.set(key, tracks);
            return send(200, { tracks }, {
                "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600",
            });
        }
        catch (error) {
            const stale = searchCache.getStale(key);
            if (stale)
                return send(200, { tracks: stale, stale: true }, {
                    "Cache-Control": "public, max-age=10, s-maxage=30, stale-while-revalidate=120",
                });
            throw error;
        }
    });
    get(new RegExp(`^${prefix}/stream/([^/]+)$`), async (params, [rawId], send) => {
        const quality = parseQuality(params.get("quality") ?? undefined);
        const atmos = params.get("atmos") ?? "auto";
        const id = decodeURIComponent(rawId ?? "");
        if (!/^qobuz_[A-Za-z0-9_-]{10,120}$/.test(id))
            throw notFound("track not found");
        const upstreamId = upstreamIdFromPublicId(id, config.idSecret);
        if (!upstreamId)
            throw notFound("track not available");
        const stream = await provider.getStream(upstreamId, quality, atmos);
        if (!stream)
            throw notFound("track not available");
        let result;
        try {
            result = streamResponse(stream, quality);
        }
        catch {
            throw notFound("track has no playable rendition");
        }
        send(200, result);
    });
}
function parseQuality(value) {
    const normalized = (value ?? "LOSSLESS").toUpperCase();
    if (normalized === "LOSSLESS" ||
        normalized === "HIGH" ||
        normalized === "LOW")
        return normalized;
    throw badRequest("quality must be LOSSLESS, HIGH, or LOW");
}
export async function handler(req, res) {
    const send = (status, body, headers = {}) => {
        const isText = typeof body === "string";
        const payload = isText ? body : JSON.stringify(body);
        res.writeHead(status, {
            "Content-Type": isText
                ? "text/html; charset=utf-8"
                : "application/json; charset=utf-8",
            ...headers,
        });
        res.end(payload);
    };
    try {
        if (req.method !== "GET" && req.method !== "HEAD")
            return send(405, { error: "method not allowed" });
        const url = new URL(req.url ?? "/", "http://localhost");
        for (const route of routes) {
            const match = route.pattern.exec(url.pathname);
            if (match)
                return await route.handler(url.searchParams, match.slice(1), send);
        }
        send(404, { error: "not found" });
    }
    catch (error) {
        if (error instanceof AppError)
            return send(error.statusCode, { error: error.message });
        const candidate = error;
        const status = typeof candidate.statusCode === "number"
            ? candidate.statusCode
            : typeof candidate.status === "number"
                ? candidate.status
                : 500;
        console.error(JSON.stringify({
            level: "error",
            msg: error instanceof Error ? error.message : String(error),
        }));
        send(status, {
            error: status >= 500 ? "upstream service unavailable" : "request failed",
        });
    }
}
const app = createServer((req, res) => {
    void handler(req, res);
});
if (process.env.VERCEL !== "1") {
    app.listen(config.port, config.host, () => {
        console.log(JSON.stringify({
            level: "info",
            msg: "EchoMusic addon listening",
            host: config.host,
            port: config.port,
            provider: config.provider,
        }));
    });
    app.on("error", (error) => {
        console.error(error);
        process.exit(1);
    });
}
export { app, parseQuality };
