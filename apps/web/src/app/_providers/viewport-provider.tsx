"use client"

import { retrieveLaunchParams, useSignal, viewport } from "@tma.js/sdk-react"
import { type ReactNode, useEffect, useMemo } from "react"

type ViewportProviderProps = {
	children: ReactNode
}

const ViewportProviderComponent = ({ children }: ViewportProviderProps) => {
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
