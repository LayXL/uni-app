import { hapticFeedback } from "@tma.js/sdk-react"
import bridge from "@vkontakte/vk-bridge"

import { isTelegram } from "./is-telegram"

export type HapticType =
	| "light"
	| "medium"
	| "heavy"
	| "selection"
	| "error"
	| "success"
	| "warning"

export const haptic = (type: HapticType) => {
	const platform = isTelegram() ? "telegram" : "vk"

	try {
		switch (type) {
			case "light":
			case "medium":
			case "heavy":
				if (platform === "telegram") {
					hapticFeedback.impactOccurred(type)
				} else {
					bridge.send("VKWebAppTapticImpactOccurred", { style: type })
				}
				break
			case "selection":
				if (platform === "telegram") {
					hapticFeedback.selectionChanged()
				} else {
					bridge.send("VKWebAppTapticSelectionChanged")
				}
				break
			case "error":
			case "success":
				if (platform === "telegram") {
					hapticFeedback.notificationOccurred(type)
				} else {
					bridge.send("VKWebAppTapticNotificationOccurred", { type })
				}
				break
		}
	} catch {}
}
