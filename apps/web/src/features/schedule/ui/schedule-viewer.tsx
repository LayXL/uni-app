"use client"

import { useQuery } from "@tanstack/react-query"
import { addDays, format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { Fragment, useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { EventCard } from "@/entities/event/ui/event-card"
import { isLessonActive } from "@/entities/lesson/lib/is-lesson-active"
import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"
import { useNowInYekaterinburg } from "@/shared/hooks/use-now-in-yekaterinburg"

import { useScheduleGroup } from "../hooks/use-schedule-group"
import { ScheduleChannelBanner } from "./schedule-channel-banner"
import { ScheduleDayChanges } from "./schedule-day-changes"
import { WithoutLessonsPlaceholder } from "./without-lessons-placeholder"

export const ScheduleViewerWithGroup = ({
	group,
	isTeacherView,
	onClassroomClick,
}: {
	group: number
	isTeacherView?: boolean
	onClassroomClick?: (classroomId: number) => void
}) => {
	const dates = getNextTwoWeeksDates()
	const now = useNowInYekaterinburg()
	const today = format(now, "yyyy-MM-dd")
	const tomorrow = format(addDays(now, 1), "yyyy-MM-dd")

	const { data } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: { group, dates },
		}),
	)

	const { data: events } = useQuery(
		orpc.events.getEvents.queryOptions({
			input: { dates, group },
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
			{groupedSchedule.map(({ date, lessons }, dayIndex) => {
				const dayEvents = eventsByDate.get(date) ?? []
				const relativeDateLabel =
					date === today ? "сегодня" : date === tomorrow ? "завтра" : null

				return (
					<Fragment key={date}>
						<div className="px-2 flex flex-col gap-2">
							<h2 className="flex items-baseline justify-between gap-2 px-2 text-lg font-semibold">
								<span>
									{format(parseISO(date), "d MMMM, EEEE", { locale: ru })}
								</span>
								{relativeDateLabel && (
									<span className="shrink-0 text-sm font-normal text-muted">
										{relativeDateLabel}
									</span>
								)}
							</h2>
							<ScheduleDayChanges lessons={lessons} />
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
										isActive={isLessonActive(lesson, now)}
										onClassroomClick={onClassroomClick}
										isTeacherView={isTeacherView}
									/>
								))}
							</div>
						</div>
						{dayIndex === 0 && !isTeacherView && <ScheduleChannelBanner />}
					</Fragment>
				)
			})}
		</div>
	)
}

export const ScheduleViewer = ({
	onClassroomClick,
}: {
	onClassroomClick?: (classroomId: number) => void
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
