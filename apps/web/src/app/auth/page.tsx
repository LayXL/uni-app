"use client"

import {
	emitEvent,
	mockTelegramEnv,
	retrieveRawInitData,
} from "@tma.js/sdk-react"
import cookie from "js-cookie"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const noInsets = {
	left: 0,
	top: 0,
	bottom: 0,
	right: 0,
} as const

const themeParams = {
	accent_text_color: "#6ab2f2",
	bg_color: "#17212b",
	button_color: "#5288c1",
	button_text_color: "#ffffff",
	destructive_text_color: "#ec3942",
	header_bg_color: "#17212b",
	hint_color: "#708499",
	link_color: "#6ab3f3",
	secondary_bg_color: "#232e3c",
	section_bg_color: "#17212b",
	section_header_text_color: "#6ab3f3",
	subtitle_text_color: "#708499",
	text_color: "#f5f5f5",
} as const

const launchParams = {
	tgWebAppThemeParams: themeParams,
	tgWebAppData: new URLSearchParams([
		["user", JSON.stringify({ id: 1, first_name: "Vitaly" })],
		["hash", "test"],
		["signature", "test"],
		["auth_date", Date.now().toString()],
	]),
	tgWebAppStartParam: "debug",
	tgWebAppVersion: "8",
	tgWebAppPlatform: "tdesktop",
} as const

type OnEvent = NonNullable<Parameters<typeof mockTelegramEnv>[0]>["onEvent"]

const onEvent: OnEvent = (event) => {
	if (event.name === "web_app_request_theme") {
		return emitEvent("theme_changed", { theme_params: themeParams })
	}
	if (event.name === "web_app_request_viewport") {
		return emitEvent("viewport_changed", {
			height: window.innerHeight,
			width: window.innerWidth,
			is_expanded: true,
			is_state_stable: true,
		})
	}
	if (event.name === "web_app_request_content_safe_area") {
		return emitEvent("content_safe_area_changed", noInsets)
	}
	if (event.name === "web_app_request_safe_area") {
		return emitEvent("safe_area_changed", noInsets)
	}
}

export default function Page() {
	const router = useRouter()

	useEffect(() => {
		let hash = retrieveRawInitData()

		if (!hash && process.env.NODE_ENV === "development") {
			mockTelegramEnv({ launchParams, onEvent })
			hash = retrieveRawInitData()
		}

		if (hash && hash.length > 0) {
			cookie.set("session", `tma ${hash}`, { expires: 7 })
			router.replace("/")
		}
	}, [router])

	return null
}
