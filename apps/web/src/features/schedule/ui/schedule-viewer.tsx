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
import { useUserFeedbackPrompt } from "../hooks/use-user-feedback-prompt"
import { mergeConsecutiveLessons } from "../lib/merge-consecutive-lessons"
import { ScheduleChannelBanner } from "./schedule-channel-banner"
import { ScheduleDayChanges } from "./schedule-day-changes"
import { ScheduleEnd } from "./schedule-end"
import { UserFeedbackCard } from "./user-feedback-card"
import { WithoutLessonsPlaceholder } from "./without-lessons-placeholder"

export const ScheduleViewerWithGroup = ({
	group,
	isTeacherView,
	onClassroomClick,
}: {
	group: number
	isTeacherView: boolean
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
	const feedbackPrompt = useUserFeedbackPrompt({ enabled: !isTeacherView })
	const sections: {
		days: typeof groupedSchedule
		isEmpty: boolean
		startIndex: number
		endIndex: number
	}[] = []

	for (const [index, day] of groupedSchedule.entries()) {
		const isEmpty =
			day.lessons.length === 0 && !eventsByDate.get(day.date)?.length
		const previous = sections.at(-1)
		const previousDay = previous?.days.at(-1)
		const isConsecutive =
			previousDay &&
			format(addDays(parseISO(previousDay.date), 1), "yyyy-MM-dd") === day.date

		if (!isTeacherView && isEmpty && previous?.isEmpty && isConsecutive) {
			previous.days.push(day)
			previous.endIndex = index
		} else {
			sections.push({
				days: [day],
				isEmpty,
				startIndex: index,
				endIndex: index,
			})
		}
	}

	return (
		<div className="pb-2 flex flex-col gap-6">
			{sections.map(({ days, startIndex, endIndex }) => {
				const lastDay = days.at(-1)
				if (!lastDay) return null
				const { date, lessons } = lastDay
				const dayEvents = eventsByDate.get(date) ?? []
				const lessonCards = isTeacherView
					? lessons.map((lesson) => [lesson])
					: mergeConsecutiveLessons(lessons)

				return (
					<Fragment key={date}>
						<div className="px-2 flex flex-col gap-2">
							{days.map(({ date: dayDate }) => {
								const relativeDateLabel =
									dayDate === today
										? "сегодня"
										: dayDate === tomorrow
											? "завтра"
											: null

								return (
									<h2
										key={dayDate}
										className="flex items-baseline justify-between gap-2 px-2 text-lg font-semibold"
									>
										<span>
											{format(parseISO(dayDate), "d MMMM, EEEE", {
												locale: ru,
											})}
										</span>
										{relativeDateLabel && (
											<span className="shrink-0 text-sm font-normal text-muted">
												{relativeDateLabel}
											</span>
										)}
									</h2>
								)
							})}
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
									<WithoutLessonsPlaceholder
										date={date}
										startDate={days[0]?.date}
										isTeacherView={isTeacherView}
									/>
								)}
								{lessonCards.map(
									([lesson, ...followingLessons], i) =>
										lesson && (
											<LessonCard
												key={i}
												group={group}
												lesson={lesson}
												followingLessons={followingLessons}
												isActive={[lesson, ...followingLessons].some((item) =>
													isLessonActive(item, now),
												)}
												onClassroomClick={onClassroomClick}
												isTeacherView={isTeacherView}
											/>
										),
								)}
							</div>
						</div>
						{startIndex === 0 &&
							!isTeacherView &&
							feedbackPrompt.shouldShow && (
								<UserFeedbackCard
									onSubmit={feedbackPrompt.submit}
									onClose={feedbackPrompt.dismiss}
								/>
							)}
						{startIndex <= 2 &&
							endIndex >= 2 &&
							!isTeacherView &&
							feedbackPrompt.isResolved && <ScheduleChannelBanner />}
					</Fragment>
				)
			})}
			{groupedSchedule.length > 0 && <ScheduleEnd />}
		</div>
	)
}

export const ScheduleViewer = ({
	onClassroomClick,
}: {
	onClassroomClick?: (classroomId: number) => void
}) => {
	const { group } = useScheduleGroup()
	const { data: groups } = useQuery(orpc.groups.getAllGroups.queryOptions({}))
	const selectedGroup = groups?.find((item) => item.id === group?.id)

	if (!selectedGroup) {
		return null
	}

	return (
		<ScheduleViewerWithGroup
			group={selectedGroup.id}
			isTeacherView={selectedGroup.type === "teacher"}
			onClassroomClick={onClassroomClick}
		/>
	)
}
