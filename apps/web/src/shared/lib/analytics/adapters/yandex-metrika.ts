import type {
	AnalyticsAdapter,
	AnalyticsEvent,
	AnalyticsPageView,
} from "../types"

export const YANDEX_METRIKA_COUNTER_ID = 112037217

type PendingCall =
	| { method: "reachGoal"; event: AnalyticsEvent }
	| { method: "hit"; pageView: AnalyticsPageView }
	| { method: "setUserID"; userId: string }

const pendingCalls: PendingCall[] = []

const send = (call: PendingCall) => {
	if (typeof window === "undefined") return false

	const ym = window.ym
	if (!ym) return false

	if (call.method === "setUserID") {
		ym(YANDEX_METRIKA_COUNTER_ID, "setUserID", call.userId)
	} else if (call.method === "reachGoal") {
		ym(
			YANDEX_METRIKA_COUNTER_ID,
			"reachGoal",
			call.event.name,
			call.event.params,
		)
	} else {
		ym(YANDEX_METRIKA_COUNTER_ID, "hit", call.pageView.url, {
			referer: call.pageView.referer,
		})
	}

	return true
}

const enqueueOrSend = (call: PendingCall) => {
	if (!send(call)) pendingCalls.push(call)
}

export const flushYandexMetrikaQueue = () => {
	if (typeof window === "undefined" || !window.ym) return

	for (const call of pendingCalls.splice(0)) send(call)
}

export const setYandexMetrikaUserId = (userId: string) => {
	enqueueOrSend({ method: "setUserID", userId })
}

export const yandexMetrikaAdapter: AnalyticsAdapter = {
	track: (event) => enqueueOrSend({ method: "reachGoal", event }),
	trackPageView: (pageView) => enqueueOrSend({ method: "hit", pageView }),
}
