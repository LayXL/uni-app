"use client"

import { useQuery } from "@tanstack/react-query"
import { addDays, format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { Fragment, useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { EventCard } from "@/entities/event/ui/event-card"
import { isLessonActive } from "@/entities/lesson/lib/is-lesson-active"
import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { groupScheduleItems } from "@/features/schedule/lib/group-schedule-items"
import { useNowInYekaterinburg } from "@/shared/hooks/use-now-in-yekaterinburg"
import { cn } from "@/shared/utils/cn"

import { useScheduleGroup } from "../hooks/use-schedule-group"
import { useUserFeedbackPrompt } from "../hooks/use-user-feedback-prompt"
import { useCardSettings } from "../model/card-settings"
import { ScheduleCardList } from "./schedule-card-list"
import { ScheduleChannelBanner } from "./schedule-channel-banner"
import { ScheduleDayChanges } from "./schedule-day-changes"
import { ScheduleDayView } from "./schedule-day-view"
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
	const settings = useCardSettings()
	const { showFullTeacherName, showParallelGroups, mergeCards, viewMode } =
		settings
	const now = useNowInYekaterinburg()
	const today = format(now, "yyyy-MM-dd")
	const tomorrow = format(addDays(now, 1), "yyyy-MM-dd")
	const dates = getNextTwoWeeksDates()
	const [requestedDate, setSelectedDate] = useState(today)
	const selectedDate = dates.includes(requestedDate)
		? requestedDate
		: (dates[0] ?? today)

	const scheduleQuery = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: { group, dates },
		}),
	)

	const eventsQuery = useQuery(
		orpc.events.getEvents.queryOptions({
			input: { dates, group },
		}),
	)

	const { data } = scheduleQuery
	const { data: events } = eventsQuery
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

		if (
			viewMode === "list" &&
			!isTeacherView &&
			isEmpty &&
			previous?.isEmpty &&
			isConsecutive
		) {
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

	const renderContent = (dayDate?: string) => {
		const visibleSections = dayDate
			? sections.filter((section) => section.days[0]?.date === dayDate)
			: sections
		return (
			<div
				className={cn(
					"pb-2 flex flex-col gap-6",
					viewMode === "day" && "flex-1",
				)}
			>
				{visibleSections.map(({ days, startIndex, endIndex }) => {
					const lastDay = days.at(-1)
					if (!lastDay) return null
					const { date, lessons } = lastDay
					const dayEvents = eventsByDate.get(date) ?? []

					return (
						<Fragment key={date}>
							<div
								className={cn(
									"px-2 flex flex-col gap-2",
									viewMode === "day" && "flex-1",
								)}
							>
								{viewMode === "list" &&
									days.map(({ date: dayDate }) => {
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
								<div
									className={cn(
										"flex flex-col gap-2",
										viewMode === "day" && "flex-1",
									)}
								>
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
											fillHeight={viewMode === "day"}
											date={date}
											startDate={days[0]?.date}
											isTeacherView={isTeacherView}
										/>
									)}
									{lessons.length > 0 && (
										<ScheduleCardList mergeCards={mergeCards}>
											{lessons.map((lesson, i) => (
												<LessonCard
													key={i}
													variant={mergeCards ? "row" : "card"}
													showFullTeacherName={showFullTeacherName}
													showParallelGroups={showParallelGroups}
													group={group}
													lesson={lesson}
													isActive={isLessonActive(lesson, now)}
													onClassroomClick={onClassroomClick}
													isTeacherView={isTeacherView}
												/>
											))}
										</ScheduleCardList>
									)}
								</div>
							</div>
							{viewMode === "list" &&
								startIndex === 0 &&
								!isTeacherView &&
								feedbackPrompt.shouldShow && (
									<UserFeedbackCard
										onSubmit={feedbackPrompt.submit}
										onClose={feedbackPrompt.dismiss}
									/>
								)}
							{viewMode === "list" &&
								startIndex <= 2 &&
								endIndex >= 2 &&
								!isTeacherView &&
								feedbackPrompt.isResolved && <ScheduleChannelBanner />}
						</Fragment>
					)
				})}
				{viewMode === "list" && groupedSchedule.length > 0 && <ScheduleEnd />}
			</div>
		)
	}

	const loading = scheduleQuery.isPending || eventsQuery.isPending
	const failed = scheduleQuery.isError || eventsQuery.isError
	const renderBody = (dayDate?: string) =>
		failed ? (
			<div role="alert" className="px-4 py-6 text-sm text-muted">
				<p>Не удалось загрузить расписание.</p>
				<button
					type="button"
					className="mt-2 text-accent"
					onClick={() => {
						void scheduleQuery.refetch()
						void eventsQuery.refetch()
					}}
				>
					Попробовать ещё раз
				</button>
			</div>
		) : loading ? (
			<p role="status" className="px-4 py-6 text-sm text-muted">
				Загрузка расписания…
			</p>
		) : (
			renderContent(dayDate)
		)

	return (
		<div className={cn("flex flex-col gap-4", viewMode === "day" && "flex-1")}>
			{settings.error && (
				<div role="alert" className="px-4 text-sm text-destructive">
					<p>{settings.error}</p>
					<button type="button" className="underline" onClick={settings.retry}>
						Повторить загрузку
					</button>
				</div>
			)}
			{viewMode === "day" ? (
				<ScheduleDayView
					dates={dates}
					selectedDate={selectedDate}
					today={today}
					onSelect={setSelectedDate}
					renderDay={renderBody}
				/>
			) : (
				renderBody()
			)}
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
