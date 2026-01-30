"use client"

import { useQuery } from "@tanstack/react-query"
import { differenceInSeconds, format, isAfter, parse } from "date-fns"
import { useEffect, useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { LiquidBorder } from "@/shared/ui/liquid-border"

import { useScheduleGroup } from "../hooks/use-schedule-group"

const getOrdinal = (n: number) => `${n}-й`

const formatTimeDiff = (diff: number) => {
	const h = Math.floor(diff / 3600)
	const m = Math.floor((diff % 3600) / 60)
	const s = diff % 60

	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
	}
	return `${m}:${s.toString().padStart(2, "0")}`
}

const getNowInYekaterinburg = () => {
	return new Date(
		new Date().toLocaleString("en-US", { timeZone: "Asia/Yekaterinburg" }),
	)
}

const formatDuration = (diffInSeconds: number) => {
	const hours = Math.floor(diffInSeconds / 3600)
	const minutes = Math.floor((diffInSeconds % 3600) / 60)

	if (hours > 0) {
		return `${hours} ч ${minutes} мин`
	}
	return `${minutes} мин`
}

const ScheduleTimerWithGroup = ({
	group,
	initialTimestamp,
}: {
	group: number
	initialTimestamp?: number
}) => {
	const dates = getNextTwoWeeksDates()
	const [now, setNow] = useState<Date>(
		initialTimestamp ? new Date(initialTimestamp) : getNowInYekaterinburg(),
	)

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(getNowInYekaterinburg())
		}, 1000)

		return () => clearInterval(interval)
	}, [])

	const { data: schedule } = useQuery(
		orpc.schedule.getSchedule.queryOptions({ input: { group, dates } }),
	)

	const { data: timetable } = useQuery(
		orpc.schedule.getTimetable.queryOptions(),
	)

	const timerState = useMemo(() => {
		if (!schedule || !timetable || !now) return null

		const today = format(now, "yyyy-MM-dd")
		const todayLessons = schedule
			.filter((l) => l.date === today)
			.sort((a, b) => a.order - b.order)

		if (todayLessons.length === 0) {
			return null
		}

		const weekday = now.getDay()
		const todayTimetable = timetable.find((t) => t.days.includes(weekday))

		for (const lesson of todayLessons) {
			const start = parse(
				`${lesson.date}T${lesson.startTime}`,
				"yyyy-MM-dd'T'HH:mm",
				new Date(),
			)
			const end = parse(
				`${lesson.date}T${lesson.endTime}`,
				"yyyy-MM-dd'T'HH:mm",
				new Date(),
			)

			// Before the lesson
			if (isAfter(start, now)) {
				const diff = differenceInSeconds(start, now)
				return {
					time: formatTimeDiff(diff),
					label: `до начала ${getOrdinal(lesson.order)} пары`,
				}
			}

			// During the lesson
			if (isAfter(end, now)) {
				// Check for halves
				if (todayTimetable) {
					const scheduleItem = todayTimetable.schedule.find(
						(s) => s.number === lesson.order && s.type !== "lunch",
					)

					if (scheduleItem?.attachments) {
						const firstHalf = scheduleItem.attachments.find(
							(a) => a.number === 1,
						)
						const secondHalf = scheduleItem.attachments.find(
							(a) => a.number === 2,
						)

						if (firstHalf) {
							const firstHalfEnd = parse(
								`${lesson.date}T${firstHalf.time.end}`,
								"yyyy-MM-dd'T'HH:mm",
								new Date(),
							)
							if (isAfter(firstHalfEnd, now)) {
								const diff = differenceInSeconds(firstHalfEnd, now)
								return {
									time: formatTimeDiff(diff),
									label: `до конца первой половины ${getOrdinal(lesson.order)} пары`,
								}
							}
						}

						if (secondHalf) {
							const secondHalfStart = parse(
								`${lesson.date}T${secondHalf.time.start}`,
								"yyyy-MM-dd'T'HH:mm",
								new Date(),
							)
							if (isAfter(secondHalfStart, now)) {
								const diff = differenceInSeconds(secondHalfStart, now)
								return {
									time: formatTimeDiff(diff),
									label: `до начала второй половины ${getOrdinal(lesson.order)} пары`,
								}
							}
						}
					}
				}

				const diff = differenceInSeconds(end, now)
				return {
					time: formatTimeDiff(diff),
					label: `до конца ${getOrdinal(lesson.order)} пары`,
				}
			}
		}

		return null
	}, [schedule, timetable, now])

	const nextEvents = useMemo(() => {
		if (!schedule || !timetable || !now) return []

		const today = format(now, "yyyy-MM-dd")
		const todayLessons = schedule
			.filter((l) => l.date === today)
			.sort((a, b) => a.order - b.order)

		const weekday = now.getDay()
		const todayTimetable = timetable.find((t) => t.days.includes(weekday))
		const events: { label: string; time: string }[] = []

		if (!todayTimetable) return []

		for (const lesson of todayLessons) {
			const start = parse(
				`${lesson.date}T${lesson.startTime}`,
				"yyyy-MM-dd'T'HH:mm",
				new Date(),
			)
			const end = parse(
				`${lesson.date}T${lesson.endTime}`,
				"yyyy-MM-dd'T'HH:mm",
				new Date(),
			)

			const scheduleItem = todayTimetable.schedule.find(
				(s) => s.number === lesson.order && s.type !== "lunch",
			)

			// Start of lesson
			if (isAfter(start, now)) {
				events.push({
					label: `Начало ${getOrdinal(lesson.order)} пары`,
					time: formatDuration(differenceInSeconds(start, now)),
				})
			}

			if (scheduleItem?.attachments) {
				const firstHalf = scheduleItem.attachments.find((a) => a.number === 1)
				const secondHalf = scheduleItem.attachments.find((a) => a.number === 2)

				if (firstHalf) {
					const firstHalfEnd = parse(
						`${lesson.date}T${firstHalf.time.end}`,
						"yyyy-MM-dd'T'HH:mm",
						new Date(),
					)
					if (isAfter(firstHalfEnd, now)) {
						events.push({
							label: `Конец первой половины ${getOrdinal(lesson.order)} пары`,
							time: formatDuration(differenceInSeconds(firstHalfEnd, now)),
						})
					}
				}

				if (secondHalf) {
					const secondHalfStart = parse(
						`${lesson.date}T${secondHalf.time.start}`,
						"yyyy-MM-dd'T'HH:mm",
						new Date(),
					)
					if (isAfter(secondHalfStart, now)) {
						events.push({
							label: `Начало второй половины ${getOrdinal(lesson.order)} пары`,
							time: formatDuration(differenceInSeconds(secondHalfStart, now)),
						})
					}
				}
			}

			// End of lesson
			if (isAfter(end, now)) {
				events.push({
					label: `Конец ${getOrdinal(lesson.order)} пары`,
					time: formatDuration(differenceInSeconds(end, now)),
				})
			}
		}

		return events.slice(1, 4)
	}, [schedule, timetable, now])

	if (!timerState) return null

	return (
		<div className="px-2 mb-4">
			<div className="relative bg-card p-3 rounded-3xl overflow-hidden">
				<LiquidBorder />
				<div className="text-center text-lg flex flex-col items-center justify-center">
					{timerState.time && (
						<span className="text-2xl font-semibold tabular-nums">
							{timerState.time}
						</span>
					)}
					<span className="text-sm text-muted font-medium">
						{timerState.label}
					</span>
				</div>
			</div>
			{nextEvents.length > 0 && (
				<div className="flex flex-col gap-1 px-4 mt-2">
					{nextEvents.map((event, i) => (
						<div key={i} className="text-xs flex justify-between gap-2">
							<span className="text-muted truncate">{event.label}</span>
							<span className="whitespace-nowrap">{event.time}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export const ScheduleTimer = ({
	initialTimestamp,
}: {
	initialTimestamp?: number
}) => {
	const { group } = useScheduleGroup()

	if (!group) {
		return null
	}

	return (
		<ScheduleTimerWithGroup
			group={group.id}
			initialTimestamp={initialTimestamp}
		/>
	)
}
