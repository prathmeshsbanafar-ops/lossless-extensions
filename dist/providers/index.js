import { StubQobuzProvider } from './stub.js';
import { HttpQobuzProvider } from './http.js';
import { QobuzDlProvider } from './qobuzdl.js';
import { LastBabeProvider } from './lastbabe.js';
import { createRacingProvider } from './racing.js';
import { MonochromeProvider } from './monochrome.js';
import { RemoteAddonProvider } from './remote-addon.js';
import { InstableProvider } from './instable.js';
export function createProvider(config) {
    if (config.provider === 'qobuzdl')
        return new QobuzDlProvider(config);
    if (config.provider === 'multi') {
        return createRacingProvider(new QobuzDlProvider(config), new LastBabeProvider(config), new MonochromeProvider(config));
    }
    if (config.provider === 'http')
        return new HttpQobuzProvider(config);
    return new StubQobuzProvider();
}
export function createSourceProvider(config, source) {
    if (source === 'qobuzdl')
        return new QobuzDlProvider({ ...config, apiBaseUrl: config.apiBaseUrl ?? 'https://qobuz-dll.foreyou.workers.dev' });
    if (source === 'monochrome')
        return new MonochromeProvider(config);
    if (source === 'deezer')
        return new RemoteAddonProvider(config);
    if (source === 'eljohnzc')
        return new RemoteAddonProvider(config, config.eljohnzcBaseUrl);
    if (source === 'instable')
        return new InstableProvider(config);
    return new LastBabeProvider(config);
}
