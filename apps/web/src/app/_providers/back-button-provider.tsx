"use client"

import { backButton, useSignal } from "@tma.js/sdk-react"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useRef } from "react"

import { usePopupCloseTop, usePopupStackCount } from "@/shared/ui/popup"

type BackButtonProviderProps = {
	children: ReactNode
}

const BackButtonProviderComponent = ({ children }: BackButtonProviderProps) => {
	const router = useRouter()
	const pathname = usePathname()

	const popupCount = usePopupStackCount()
	const closeTopPopup = usePopupCloseTop()

	const isAvailable = useSignal(backButton.mount.isAvailable, () => false)

	const closeTopPopupRef = useRef(closeTopPopup)
	useEffect(() => {
		closeTopPopupRef.current = closeTopPopup
	}, [closeTopPopup])

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		backButton.mount()

		const offClick = backButton.onClick(() => {
			const closed = closeTopPopupRef.current()
			if (!closed) {
				router.back()
			}
		})

		return () => {
			backButton.unmount()
			offClick()
		}
	}, [router, isAvailable])

	useEffect(() => {
		if (!isAvailable) return

		const hasHistory =
			window.history.length > 1 && Boolean(pathname) && pathname !== "/"
		const hasPopups = popupCount > 0

		if (hasHistory || hasPopups) {
			backButton.show()
		} else {
			backButton.hide()
		}
	}, [pathname, popupCount, isAvailable])

	return children
}

export const BackButtonProvider = ({ children }: BackButtonProviderProps) => {
	return <BackButtonProviderComponent>{children}</BackButtonProviderComponent>
}
