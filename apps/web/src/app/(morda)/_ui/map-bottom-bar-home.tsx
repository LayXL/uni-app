"use client"

import { motion, useScroll, useTransform } from "motion/react"
import type { ReactNode } from "react"

import { useViewportDimensions } from "@/shared/hooks/use-viewport-dimensions"

type MapBottomBarHomeProps = {
	children: ReactNode
}

export const MapBottomBarHome = ({ children }: MapBottomBarHomeProps) => {
	const { scrollY } = useScroll()

	const { height } = useViewportDimensions()
	const heightSafe = Math.max(height, 1)

	const value = useTransform(scrollY, [0, heightSafe], [0, 1])

	const opacity = useTransform(value, [0.4, 0.7], [1, 0])
	const pointerEvents = useTransform(value, [0.4, 0.6], ["auto", "none"])

	return <motion.div style={{ opacity, pointerEvents }}>{children}</motion.div>
}
