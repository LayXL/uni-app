"use client"

import { useRouter } from "@tanstack/react-router"

import { Icon } from "./icon"
import { LiquidBorder } from "./liquid-border"
import { Touchable } from "./touchable"

export function BackButton() {
	const router = useRouter()

	const handleClick = () => {
		router.history.back()
	}

	return (
		<Touchable>
			<button
				type="button"
				onClick={handleClick}
				className="relative p-2 rounded-full bg-card"
			>
				<LiquidBorder />
				<Icon
					name="iconify:material-symbols:arrow-back-ios-new-rounded"
					size={16}
					className="text-foreground"
				/>
			</button>
		</Touchable>
	)
}
