import type { ReactNode } from "react"

import { ScheduleGroup } from "./schedule-group"
import { ScheduleTitle } from "./schedule-title"

export const ScheduleHeader = ({ action }: { action?: ReactNode }) => {
	return (
		<div className="pl-4 pr-2 h-16 flex items-center justify-between gap-3">
			<h2 className="min-w-0 flex-1 text-2xl leading-tight font-semibold">
				<ScheduleTitle />
			</h2>
			<div className="flex shrink-0 items-center gap-2">
				<ScheduleGroup />
				{action}
			</div>
		</div>
	)
}
