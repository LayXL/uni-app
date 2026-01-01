"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { useUser } from "@/entities/user/hooks/useUser"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"

const ScheduleViewerWithGroup = ({ group }: { group: number }) => {
	const { data } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: { group, dates: getNextTwoWeeksDates() },
		}),
	)

	const groupedSchedule = data ? groupScheduleItems(data) : []

	return (
		<div className="pb-2">
			{groupedSchedule.map(({ date, lessons }) => (
				<div key={date} className="px-2">
					<h2 className="text-lg font-semibold px-2 pt-4 pb-2">
						{format(date, "d MMMM", { locale: ru })}
					</h2>
					<div className="flex flex-col gap-2">
						{lessons.map((lesson, i) => (
							<LessonCard key={i} group={group} lesson={lesson} />
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export const ScheduleViewer = () => {
	const user = useUser()

	if (!user.group) {
		return null
	}

	return <ScheduleViewerWithGroup group={user.group.id} />
}
