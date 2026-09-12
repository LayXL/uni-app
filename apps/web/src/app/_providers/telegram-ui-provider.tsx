"use client"

import { useLocation, useRouter } from "@tanstack/react-router"
import {
	backButton,
	miniApp,
	retrieveLaunchParams,
	themeParams,
	useSignal,
	viewport,
} from "@tma.js/sdk-react"
import { type ReactNode, Suspense, useEffect, useMemo, useRef } from "react"

import { FullscreenSafeAreaGradient } from "@/shared/ui/fullscreen-safe-area-gradient"
import { usePopupCloseTop, usePopupStackCount } from "@/shared/ui/popup"

const useMiniApp = () => {
	const isAvailable = useSignal(miniApp.mount.isAvailable, () => false)

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		miniApp.mount()
		miniApp.ready()
		miniApp.bindCssVars()
	}, [isAvailable])
}

const useViewport = () => {
	const isAvailable = useSignal(viewport.mount.isAvailable, () => false)
	const isRequestFullscreenAvailable = useSignal(
		viewport.requestFullscreen.isAvailable,
		() => false,
	)

	const isMobile = useMemo(() => {
		if (typeof window === "undefined" || !isAvailable) {
			return false
		}

		const { tgWebAppPlatform } = retrieveLaunchParams()
		return tgWebAppPlatform === "android" || tgWebAppPlatform === "ios"
	}, [isAvailable])

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		viewport.mount()
		viewport.bindCssVars()
	}, [isAvailable])

	useEffect(() => {
		if (!isRequestFullscreenAvailable || !isMobile) {
			return
		}

		viewport.requestFullscreen()
	}, [isRequestFullscreenAvailable, isMobile])
}

const useThemeParams = () => {
	const isAvailable = useSignal(themeParams.mount.isAvailable, () => false)

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		themeParams.mount()
		themeParams.bindCssVars()
	}, [isAvailable])
}

const useBackButton = () => {
	const router = useRouter()
	const pathname = useLocation({ select: (location) => location.pathname })

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
				router.history.back()
			}
		})

		return () => {
			backButton.unmount()
			offClick()
		}
	}, [router, isAvailable])

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		const isMainPage = ["/", "/map", "/homework"].includes(pathname)
		const hasHistory = window.history.length > 1 && !isMainPage
		const hasPopups = popupCount > 0

		if (hasHistory || hasPopups) {
			backButton.show()
		} else {
			backButton.hide()
		}
	}, [pathname, popupCount, isAvailable])
}

const TelegramNavigationUi = () => {
	useBackButton()

	return <FullscreenSafeAreaGradient />
}

export const TelegramUiProvider = ({ children }: { children: ReactNode }) => {
	useMiniApp()
	useViewport()
	useThemeParams()

	return (
		<>
			{children}
			<Suspense fallback={null}>
				<TelegramNavigationUi />
			</Suspense>
		</>
	)
}
