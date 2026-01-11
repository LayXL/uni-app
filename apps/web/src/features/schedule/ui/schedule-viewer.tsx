"use client"

import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { useUser } from "@/entities/user/hooks/useUser"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"

import { WithoutLessonsPlaceholder } from "./without-lessons-placeholder"

const ScheduleViewerWithGroup = ({ group }: { group: number }) => {
	const dates = getNextTwoWeeksDates()

	const { data } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: { group, dates },
		}),
	)

	const groupedSchedule = data ? groupScheduleItems(data, dates) : []

	return (
		<div className="pb-2 flex flex-col gap-6">
			{groupedSchedule.map(({ date, lessons }) => (
				<div key={date} className="px-2 flex flex-col gap-2">
					<h2 className="text-lg font-semibold px-2">
						{format(parseISO(date), "d MMMM, EEEE", { locale: ru })}
					</h2>
					<div className="flex flex-col gap-2">
						{lessons.length === 0 && <WithoutLessonsPlaceholder date={date} />}
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
