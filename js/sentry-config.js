// sentry-config.js - Sentry Error Tracking Configuration

const SENTRY_DSN = "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

if (window.Sentry) {
    window.Sentry.init({
        dsn: SENTRY_DSN,
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.0,
        replaysOnErrorSampleRate: 0.2
    });

    window.Sentry.setTag("app", "ShopUp");
    window.Sentry.setTag("site", window.location.hostname);
    window.Sentry.setTag("page", window.location.pathname);
    window.Sentry.setContext("browser", {
        userAgent: navigator.userAgent
    });
}
