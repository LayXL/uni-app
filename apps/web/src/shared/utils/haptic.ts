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

const impactTypes = new Set<HapticType>(["light", "medium", "heavy"])
const notificationTypes = new Set<HapticType>(["error", "success", "warning"])

const isImpactType = (type: HapticType): type is "light" | "medium" | "heavy" =>
	impactTypes.has(type)

const isNotificationType = (
	type: HapticType,
): type is "error" | "success" | "warning" => notificationTypes.has(type)

const telegramHaptic = (type: HapticType) => {
	if (isImpactType(type)) {
		hapticFeedback.impactOccurred(type)
		return
	}

	if (type === "selection") {
		hapticFeedback.selectionChanged()
		return
	}

	if (isNotificationType(type)) {
		hapticFeedback.notificationOccurred(type)
	}
}

const vkHaptic = (type: HapticType) => {
	if (isImpactType(type)) {
		bridge.send("VKWebAppTapticImpactOccurred", { style: type })
		return
	}

	if (type === "selection") {
		bridge.send("VKWebAppTapticSelectionChanged")
		return
	}

	if (isNotificationType(type)) {
		bridge.send("VKWebAppTapticNotificationOccurred", { type })
	}
}

export const haptic = (type: HapticType) => {
	try {
		if (isTelegram()) {
			telegramHaptic(type)
			return
		}

		vkHaptic(type)
	} catch {}
}
