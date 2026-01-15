"use client"

import { motion, useScroll, useTransform } from "motion/react"
import type { ReactNode } from "react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { useViewportDimensions } from "@/shared/hooks/use-viewport-dimensions"

type ScheduleViewerHomeProps = {
	children: ReactNode
}

export const ScheduleViewerHome = ({ children }: ScheduleViewerHomeProps) => {
	const isActive = useRouteBuilder((state) => state.isActive)

	const { scrollY } = useScroll()

	const { height } = useViewportDimensions()
	const heightSafe = Math.max(height, 1)

	const value = useTransform(scrollY, [0, heightSafe], [0, 1])

	const borderOpacity = useTransform(value, [0.4, 0.7], ["100%", "0%"])

	return (
		<motion.div
			className="mt-[80vh] z-10 [&>div]:border-t [&>div]:border-(--border-color)"
			initial={{
				"--border-color":
					"color-mix(in oklab, var(--border) 100%, transparent)",
			}}
			style={{ "--border-opacity": borderOpacity }}
			animate={{
				"--border-color":
					"color-mix(in oklab, var(--border) var(--border-opacity), transparent)",
				opacity: isActive ? 0 : 1,
				pointerEvents: isActive ? "none" : "auto",
			}}
		>
			{children}
		</motion.div>
	)
}
