"use client"

import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { EventCard } from "@/entities/event/ui/event-card"
import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"

import { useScheduleGroup } from "../hooks/use-schedule-group"
import { WithoutLessonsPlaceholder } from "./without-lessons-placeholder"

export const ScheduleViewerWithGroup = ({
	group,
	isTeacherView,
	onClassroomClick,
}: {
	group: number
	isTeacherView?: boolean
	onClassroomClick?: (classroom: string) => void
}) => {
	const dates = getNextTwoWeeksDates()

	const { data } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: { group, dates },
		}),
	)

	const { data: events } = useQuery(
		orpc.events.getEvents.queryOptions({
			input: { dates },
		}),
	)

	const eventsByDate = useMemo(() => {
		const map = new Map<string, typeof events>()
		if (!events) return map
		for (const event of events) {
			const dateKey = format(new Date(event.date), "yyyy-MM-dd")
			const list = map.get(dateKey) ?? []
			list.push(event)
			map.set(dateKey, list)
		}
		return map
	}, [events])

	const groupedSchedule = data ? groupScheduleItems(data, dates) : []

	return (
		<div className="pb-2 flex flex-col gap-6">
			{groupedSchedule.map(({ date, lessons }) => {
				const dayEvents = eventsByDate.get(date) ?? []

				return (
					<div key={date} className="px-2 flex flex-col gap-2">
						<h2 className="text-lg font-semibold px-2">
							{format(parseISO(date), "d MMMM, EEEE", { locale: ru })}
						</h2>
						<div className="flex flex-col gap-2">
							{dayEvents.map((event) => (
								<EventCard
									key={`event-${event.id}`}
									id={event.id}
									title={event.title}
									description={event.description}
									coverImage={event.coverImage}
									backgroundColor={event.backgroundColor}
									borderColor={event.borderColor}
									textColor={event.textColor}
									buttonColor={event.buttonColor}
									date={event.date}
									buttonUrl={event.buttonUrl}
									buttonText={event.buttonText}
								/>
							))}
							{lessons.length === 0 && dayEvents.length === 0 && (
								<WithoutLessonsPlaceholder date={date} />
							)}
							{lessons.map((lesson, i) => (
								<LessonCard
									key={i}
									group={group}
									lesson={lesson}
									onClassroomClick={onClassroomClick}
									isTeacherView={isTeacherView}
								/>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export const ScheduleViewer = ({
	onClassroomClick,
}: {
	onClassroomClick?: (classroom: string) => void
}) => {
	const { group } = useScheduleGroup()

	if (!group) {
		return null
	}

	return (
		<ScheduleViewerWithGroup
			group={group.id}
			onClassroomClick={onClassroomClick}
		/>
	)
}
