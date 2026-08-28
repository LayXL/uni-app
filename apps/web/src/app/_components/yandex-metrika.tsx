"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect, useRef } from "react"

import { analytics } from "@/shared/lib/analytics"
import {
	flushYandexMetrikaQueue,
	YANDEX_METRIKA_COUNTER_ID,
} from "@/shared/lib/analytics/adapters/yandex-metrika"

export function YandexMetrika() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const previousUrl = useRef<string | null>(null)
	const search = searchParams.toString()
	const pageUrl = search ? `${pathname}?${search}` : pathname

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

	return (
		<Script
			id="yandex-metrika"
			strategy="afterInteractive"
			onReady={flushYandexMetrikaQueue}
		>
			{`
				(function(m,e,t,r,i,k,a){
					m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
					m[i].l=1*new Date();
					for (var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
					k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
				})(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}","ym");

				window.ym(${YANDEX_METRIKA_COUNTER_ID}, "init", {
					ssr: true,
					webvisor: true,
					clickmap: true,
					ecommerce: "dataLayer",
					referrer: document.referrer,
					url: window.location.href,
					accurateTrackBounce: true,
					trackLinks: true
				});
			`}
		</Script>
	)
}
