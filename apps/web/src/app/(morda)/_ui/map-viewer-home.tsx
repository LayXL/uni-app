"use client"

import { motion, useScroll, useTransform } from "motion/react"
import type { ReactNode } from "react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { useViewportDimensions } from "@/shared/hooks/use-viewport-dimensions"

type MapViewerHomeProps = {
	children: ReactNode
}

export const MapViewerHome = ({ children }: MapViewerHomeProps) => {
	const isActive = useRouteBuilder((state) => state.isActive)

	const { scrollY } = useScroll()

	const { height } = useViewportDimensions()
	const heightSafe = Math.max(height, 1)

	const value = useTransform(scrollY, [0, heightSafe], [0, 1])

	const opacity = useTransform(value, [0.4, 0.7], [1, 0])
	const filter = useTransform(value, [0.4, 0.7], ["blur(0px)", "blur(10px)"])
	const pointerEvents = useTransform(value, [0.4, 0.6], ["auto", "none"])

	return (
		<motion.div
			style={{ opacity, filter, pointerEvents }}
			initial={{ height: "var(--map-height)" }}
			animate={{
				height: isActive ? "calc(100vh - 174px)" : "var(--map-height)",
			}}
			className="fixed w-full"
		>
			{children}
		</motion.div>
	)
}
