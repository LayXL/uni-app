import type { ReactNode } from "react"

import { ScheduleGroup } from "./schedule-group"

export const ScheduleHeader = ({ action }: { action?: ReactNode }) => {
	return (
		<div className="pl-4 pr-2 h-16 flex items-center justify-between">
			<h2 className="text-2xl font-semibold">Расписание</h2>
			<div className="flex items-center gap-2">
				<ScheduleGroup />
				{action}
			</div>
		</div>
	)
}
