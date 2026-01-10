"use client"

import { retrieveLaunchParams, useSignal, viewport } from "@tma.js/sdk-react"
import { type ReactNode, useEffect, useMemo } from "react"

const defaultSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }

const useContentSafeAreaInsets = () => {
	const safeAreaInsets = useSignal(
		viewport.safeAreaInsets,
		() => defaultSafeAreaInsets,
	)
	const contentSafeAreaInsets = useSignal(
		viewport.contentSafeAreaInsets,
		() => defaultSafeAreaInsets,
	)

	useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		document.documentElement.style.setProperty(
			"--safe-area-inset-top",
			`${safeAreaInsets.top + contentSafeAreaInsets.top}px`,
		)
		document.documentElement.style.setProperty(
			"--safe-area-inset-right",
			`${safeAreaInsets.right + contentSafeAreaInsets.right}px`,
		)
		document.documentElement.style.setProperty(
			"--safe-area-inset-bottom",
			`${safeAreaInsets.bottom + contentSafeAreaInsets.bottom}px`,
		)
		document.documentElement.style.setProperty(
			"--safe-area-inset-left",
			`${safeAreaInsets.left + contentSafeAreaInsets.left}px`,
		)

		document.documentElement.style.setProperty(
			"--screen-safe-area-inset-top",
			`${safeAreaInsets.top + contentSafeAreaInsets.top}px`,
		)
		document.documentElement.style.setProperty(
			"--screen-safe-area-inset-right",
			`${safeAreaInsets.right + contentSafeAreaInsets.right}px`,
		)
		document.documentElement.style.setProperty(
			"--screen-safe-area-inset-bottom",
			`${safeAreaInsets.bottom + contentSafeAreaInsets.bottom}px`,
		)
		document.documentElement.style.setProperty(
			"--screen-safe-area-inset-left",
			`${safeAreaInsets.left + contentSafeAreaInsets.left}px`,
		)

		document.documentElement.style.setProperty(
			"--content-safe-area-inset-top",
			`${contentSafeAreaInsets.top}px`,
		)
		document.documentElement.style.setProperty(
			"--content-safe-area-inset-right",
			`${contentSafeAreaInsets.right}px`,
		)
		document.documentElement.style.setProperty(
			"--content-safe-area-inset-bottom",
			`${contentSafeAreaInsets.bottom}px`,
		)
		document.documentElement.style.setProperty(
			"--content-safe-area-inset-left",
			`${contentSafeAreaInsets.left}px`,
		)
	}, [safeAreaInsets, contentSafeAreaInsets])

	return contentSafeAreaInsets
}

type ViewportProviderProps = {
	children: ReactNode
}

const ViewportProviderComponent = ({ children }: ViewportProviderProps) => {
	useContentSafeAreaInsets()

	const isAvailable = useSignal(viewport.mount.isAvailable, () => false)
	const isRequestFullscreenAvailable = useSignal(
		viewport.requestFullscreen.isAvailable,
		() => false,
	)

	const isMobile = useMemo(() => {
		if (typeof window === "undefined") {
			return false
		}

		const { tgWebAppPlatform } = retrieveLaunchParams()
		return tgWebAppPlatform === "android" || tgWebAppPlatform === "ios"
	}, [])

	useEffect(() => {
		if (!isAvailable || !isMobile) {
			return
		}

		viewport.mount()
	}, [isAvailable, isMobile])

	useEffect(() => {
		if (!isRequestFullscreenAvailable || !isMobile) {
			return
		}

		viewport.requestFullscreen()
	}, [isRequestFullscreenAvailable, isMobile])

	return children
}

export const ViewportProvider = ({ children }: ViewportProviderProps) => {
	return <ViewportProviderComponent>{children}</ViewportProviderComponent>
}
