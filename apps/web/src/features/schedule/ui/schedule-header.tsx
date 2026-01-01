import { ScheduleGroup } from "./schedule-group"

export const ScheduleHeader = () => {
	return (
		<div className="pl-4 pr-2 h-16 flex items-center justify-between">
			<h2 className="text-2xl font-semibold">Расписание</h2>
			<ScheduleGroup />
		</div>
	)
}
