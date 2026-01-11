"use client"

import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

import { useScheduleGroup } from "../hooks/use-schedule-group"

export const ScheduleGroup = () => {
	const { group } = useScheduleGroup()

	return (
		<Touchable>
			<button
				type="button"
				className="relative w-26 bg-card rounded-3xl px-3 py-2"
			>
				<LiquidBorder />
				{group?.displayName}
			</button>
		</Touchable>
	)
}
