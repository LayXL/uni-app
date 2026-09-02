"use client"

import { useLocation } from "@tanstack/react-router"
import { useEffect, useRef } from "react"

import { analytics } from "@/shared/lib/analytics"
import {
	flushYandexMetrikaQueue,
	YANDEX_METRIKA_COUNTER_ID,
} from "@/shared/lib/analytics/adapters/yandex-metrika"

export function YandexMetrika() {
	const pageUrl = useLocation({ select: (location) => location.href })
	const previousUrl = useRef<string | null>(null)

	useEffect(() => {
		type YmQueue = NonNullable<typeof window.ym> & {
			a?: unknown[][]
			l?: number
		}

		if (!window.ym) {
			const ym: YmQueue = (...args: unknown[]) => {
				if (!ym.a) ym.a = []
				ym.a.push(args)
			}
			ym.l = Date.now()
			window.ym = ym
		}

		if (!document.querySelector('script[data-yandex-metrika="true"]')) {
			const script = document.createElement("script")
			script.async = true
			script.src = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`
			script.dataset.yandexMetrika = "true"
			script.addEventListener("load", flushYandexMetrikaQueue, { once: true })
			document.head.append(script)

			window.ym?.(YANDEX_METRIKA_COUNTER_ID, "init", {
				ssr: true,
				webvisor: true,
				clickmap: true,
				ecommerce: "dataLayer",
				referrer: document.referrer,
				url: window.location.href,
				accurateTrackBounce: true,
				trackLinks: true,
			})
		}
	}, [])

	useEffect(() => {
		const currentUrl = new URL(pageUrl, window.location.origin).href
		const referer = previousUrl.current

		previousUrl.current = currentUrl

		// Initialization registers the first page view. Only client-side
		// navigations need an explicit hit.
		if (!referer || referer === currentUrl) {
			return
		}

		analytics.trackPageView({ url: currentUrl, referer })
	}, [pageUrl])

	return null
}
