import { hapticFeedback } from "@tma.js/sdk-react"
// import bridge from "@vkontakte/vk-bridge"

export type HapticType =
	| "light"
	| "medium"
	| "heavy"
	| "selection"
	| "error"
	| "success"
	| "warning"

export const haptic = (type: HapticType) => {
	switch (type) {
		case "light":
		case "medium":
		case "heavy":
			hapticFeedback.impactOccurred(type)
			break
		case "selection":
			hapticFeedback.selectionChanged()
			break
		case "error":
		case "success":
			hapticFeedback.notificationOccurred(type)
			break
	}
}
