"use client"

import { useSignal, viewport } from "@tma.js/sdk-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const isPastHomeThreshold = () => window.scrollY >= window.innerHeight

export const FullscreenSafeAreaGradient = () => {
	const pathname = usePathname()
	const isFullscreen = useSignal(viewport.isFullscreen, () => false)
	const safeAreaInsetTop = useSignal(viewport.contentSafeAreaInsetTop, () => 0)
	const [isPastThreshold, setIsPastThreshold] = useState(false)

	useEffect(() => {
		if (pathname !== "/") {
			setIsPastThreshold(true)
			return
		}

		const updateVisibility = () => {
			setIsPastThreshold(isPastHomeThreshold())
		}

		updateVisibility()
		window.addEventListener("scroll", updateVisibility, { passive: true })
		window.addEventListener("resize", updateVisibility)

		return () => {
			window.removeEventListener("scroll", updateVisibility)
			window.removeEventListener("resize", updateVisibility)
		}
	}, [pathname])

	const isVisible = isFullscreen && safeAreaInsetTop > 0 && isPastThreshold

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[calc(var(--safe-area-inset-top)+1rem)] bg-linear-to-b from-background to-transparent transition-opacity duration-200 motion-reduce:transition-none"
			style={{ opacity: isVisible ? 1 : 0 }}
		/>
	)
}
