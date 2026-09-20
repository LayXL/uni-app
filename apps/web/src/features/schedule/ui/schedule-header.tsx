import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

import { ScheduleCardSettings } from "./schedule-card-settings"
import { ScheduleGroup } from "./schedule-group"
import { ScheduleTitle } from "./schedule-title"

export const ScheduleHeader = ({ action }: { action?: ReactNode }) => {
	return (
		<div className="pl-4 pr-2 h-16 flex items-center justify-between gap-3">
			<h2 className="min-w-0 flex-1 text-2xl leading-tight font-semibold">
				<ScheduleTitle />
			</h2>
			<div className="flex shrink-0 items-center gap-1">
				<Touchable>
					<Link
						to="/timetable"
						aria-label="Расписание звонков"
						title="Расписание звонков"
						className="relative grid size-10 shrink-0 place-items-center rounded-full bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					>
						<LiquidBorder />
						<Icon name="clock-outline-20" />
					</Link>
				</Touchable>
				<ScheduleGroup />
				<ScheduleCardSettings />
				{action}
			</div>
		</div>
	)
}
