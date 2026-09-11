import type { ReactNode } from "react"

import { cn } from "@/shared/utils/cn"

export const ScheduleCardList = ({
	mergeCards,
	children,
}: {
	mergeCards: boolean
	children: ReactNode
}) => (
	<div
		className={cn(
			"flex flex-col",
			mergeCards
				? "divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card"
				: "gap-2",
		)}
	>
		{children}
	</div>
)
