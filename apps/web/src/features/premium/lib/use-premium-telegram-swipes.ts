import { swipeBehavior, useSignal } from "@tma.js/sdk-react"
import { useEffect } from "react"

export function usePremiumTelegramSwipes() {
	// Becomes available after SDK initialization, only in supported Telegram clients.
	const isAvailable = useSignal(swipeBehavior.mount.isAvailable, () => false)

	useEffect(() => {
		if (!isAvailable) return

		const wasMounted = swipeBehavior.isMounted()
		if (!wasMounted) swipeBehavior.mount()
		const wasEnabled = swipeBehavior.isVerticalEnabled()
		swipeBehavior.disableVertical()

		return () => {
			if (wasEnabled && swipeBehavior.enableVertical.isAvailable()) {
				swipeBehavior.enableVertical()
			}
			if (!wasMounted) swipeBehavior.unmount()
		}
	}, [isAvailable])
}
