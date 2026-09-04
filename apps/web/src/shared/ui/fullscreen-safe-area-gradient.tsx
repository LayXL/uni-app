"use client"

import { useLocation } from "@tanstack/react-router"
import { useSignal, viewport } from "@tma.js/sdk-react"

import { cn } from "../utils/cn"

export const FullscreenSafeAreaGradient = () => {
	const pathname = useLocation({ select: (location) => location.pathname })
	const isFullscreen = useSignal(viewport.isFullscreen, () => false)
	const safeAreaInsetTop = useSignal(viewport.contentSafeAreaInsetTop, () => 0)
	const isSchedulePage = pathname === "/"
	const isMapPage = pathname === "/map"

	const isVisible = isSchedulePage || (isFullscreen && safeAreaInsetTop > 0)

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none fixed inset-x-0 top-0 z-40 h-[calc(var(--safe-area-inset-top)+1rem)] bg-linear-to-b to-transparent",
				isMapPage ? "from-(--map-background)" : "from-background",
				!isSchedulePage &&
					"transition-opacity duration-200 motion-reduce:transition-none",
			)}
			style={{ opacity: isVisible ? 1 : 0 }}
		/>
	)
}
