"use client"

import Link from "next/link"

import { Touchable } from "@/shared/ui/touchable"

import { useScheduleGroup } from "../hooks/use-schedule-group"

export const ScheduleGroup = () => {
	const { group } = useScheduleGroup()

	return (
		<Touchable>
			<Link
				href="/onboarding"
				className="w-26 bg-input/30 border border-input rounded-lg px-3 py-2"
			>
				{group?.displayName}
			</Link>
		</Touchable>
	)
}
