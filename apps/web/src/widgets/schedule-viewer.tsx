"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { useUser } from "@/entities/user/hooks/useUser"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"

const ScheduleViewerWithGroup = ({ group }: { group: number }) => {
	const { data } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: {
				group,
				dates: getNextTwoWeeksDates(),
			},
		}),
	)

	const groupedSchedule = data ? groupScheduleItems(data) : []

	return (
		<div>
			{groupedSchedule.map((group, i) => (
				<div key={group.date}>
					{i > 0 && <div className="bg-border h-px w-full" />}
					<div className="p-4">
						<h2 className="text-lg font-semibold">
							{format(group.date, "dd MMMM", { locale: ru })}
						</h2>
						{group.lessons.map((lesson, i) => (
							<div key={i}>
								{lesson.order}. {lesson.subject.name}
							</div>
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
