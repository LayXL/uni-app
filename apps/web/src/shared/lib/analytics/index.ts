import { yandexMetrikaAdapter } from "./adapters/yandex-metrika"
import type {
	AnalyticsAdapter,
	AnalyticsEvent,
	AnalyticsEventMap,
	AnalyticsEventName,
	AnalyticsPageView,
} from "./types"

const adapters: AnalyticsAdapter[] = [yandexMetrikaAdapter]

const forEachAdapter = (callback: (adapter: AnalyticsAdapter) => void) => {
	for (const adapter of adapters) {
		try {
			callback(adapter)
		} catch {
			// Analytics failures must not interrupt user actions.
		}
	}
}

export const analytics = {
	track<Name extends AnalyticsEventName>(
		name: Name,
		params: AnalyticsEventMap[Name],
	) {
		const event = { name, params } as AnalyticsEvent

		forEachAdapter((adapter) => adapter.track(event))
	},

	trackPageView(pageView: AnalyticsPageView) {
		forEachAdapter((adapter) => adapter.trackPageView(pageView))
	},
}

export type { AnalyticsEventMap, AnalyticsEventName }
