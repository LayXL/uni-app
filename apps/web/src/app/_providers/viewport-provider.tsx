"use client"

import { retrieveLaunchParams, useSignal, viewport } from "@tma.js/sdk-react"
import dynamic from "next/dynamic"
import { type ReactNode, useEffect, useMemo } from "react"

type ViewportProviderProps = {
	children: ReactNode
}

const ViewportProviderComponent = ({ children }: ViewportProviderProps) => {
	const isAvailable = useSignal(viewport.mount.isAvailable)
	const isRequestFullscreenAvailable = useSignal(
		viewport.requestFullscreen.isAvailable,
	)

	const isMobile = useMemo(() => {
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

export const ViewportProvider = dynamic(
	() => Promise.resolve(ViewportProviderComponent),
	{ ssr: false },
) as typeof ViewportProviderComponent
