"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { useViewportDimensions } from "@/shared/hooks/use-viewport-dimensions"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { isVK } from "@/shared/utils/is-vk"

export function SettingsButton() {
	const [isVkPlatform, setIsVkPlatform] = useState(false)
	const { scrollY } = useScroll()

	const { height } = useViewportDimensions()
	const heightSafe = Math.max(height, 1)

	const value = useTransform(scrollY, [0, heightSafe], [0, 1])

	const opacity = useTransform(value, [0.3, 0.4], [1, 0])
	const pointerEvents = useTransform(value, [0.3, 0.38], ["auto", "none"])

	useEffect(() => {
		setIsVkPlatform(isVK())
	}, [])

	if (!isVkPlatform) return null

	return (
		<motion.div
			className="fixed top-[calc(var(--safe-area-inset-top)+0.75rem)] right-[calc(var(--safe-area-inset-right)+0.75rem)] z-10"
			style={{ opacity, pointerEvents }}
		>
			<Touchable>
				<Link
					href="/settings"
					aria-label="Настройки"
					className="size-8 grid place-items-center rounded-3xl border border-border bg-background"
				>
					<Icon name="settings-24" size={16} />
				</Link>
			</Touchable>
		</motion.div>
	)
}
