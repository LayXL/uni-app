"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"

type ScheduleViewerHomeProps = {
	children: ReactNode
}

export const ScheduleViewerHome = ({ children }: ScheduleViewerHomeProps) => {
	const isActive = useRouteBuilder((state) => state.isActive)

	return (
		<motion.div
			className="mt-[80vh] z-10"
			animate={{
				opacity: isActive ? 0 : 1,
				pointerEvents: isActive ? "none" : "auto",
			}}
		>
			{children}
		</motion.div>
	)
}
