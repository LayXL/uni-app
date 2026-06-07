import "./polyfills"

import * as Sentry from "@sentry/nextjs"

Sentry.init({
	dsn: "https://df2dbf351aa540a89eb7cbf1821ef945@glitchtip.layxl.dev/1",
	tracesSampleRate: 0.01,
})
