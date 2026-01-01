"use client"

import Link from "next/link"

import { useScheduleGroup } from "../hooks/use-schedule-group"

export const ScheduleGroup = () => {
	const { group } = useScheduleGroup()

	return (
		<Link
			href="/onboarding"
			className="w-26 bg-input/30 border border-input rounded-lg px-3 py-2"
		>
			{group?.displayName}
		</Link>
	)
}
