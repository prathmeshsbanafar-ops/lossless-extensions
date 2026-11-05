/** Fallback provider for contract-only local testing. */
export class StubQobuzProvider {
    async search(_query, _quality, _atmos) { return []; }
    async getStream(_trackId, _quality, _atmos) { return null; }
}
