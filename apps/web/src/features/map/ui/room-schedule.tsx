import { skipToken, useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { motion } from "motion/react"
import { type UIEvent, useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import type { Room } from "@repo/shared/building-scheme"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { isLessonActive } from "@/entities/lesson/lib/is-lesson-active"
import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { useNowInYekaterinburg } from "@/shared/hooks/use-now-in-yekaterinburg"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

const weekdays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]

type RoomScheduleProps = {
	room?: Room | null
}

export const RoomSchedule = ({ room }: RoomScheduleProps) => {
	const now = useNowInYekaterinburg()
	const [selectedDate, setSelectedDate] = useState<string>(
		getNextTwoWeeksDates()[0],
	)

	const { data: schedule } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: room
				? { dates: getNextTwoWeeksDates(), classroomIds: [room.id] }
				: skipToken,
		}),
	)

	const filteredSchedule = useMemo(() => {
		if (!schedule) return []

		return schedule.filter((lesson) => lesson.date === selectedDate)
	}, [schedule, selectedDate])

	const [position, setPosition] = useState<"top" | "bottom" | null>("top")

	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } =
			event.target as HTMLDivElement

		if (scrollTop + clientHeight >= scrollHeight) {
			setPosition("bottom")
		} else if (scrollTop <= 0) {
			setPosition("top")
		} else {
			setPosition(null)
		}
	}

	if (!room || !schedule?.length) return null

	return (
		<div className="flex flex-col gap-2">
			<p className="text-lg font-medium">Расписание кабинета</p>
			<div className="grid overflow-scroll -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[scrollbar-width:auto] sm:[&::-webkit-scrollbar]:block">
				<div className="flex flex-row gap-1 w-full">
					{getNextTwoWeeksDates().map((date) => (
						<Touchable key={date}>
							<button
								type="button"
								className={cn(
									"relative bg-card rounded-3xl px-3 py-2 flex gap-1 items-end transition-colors",
									selectedDate === date && "bg-accent text-accent-foreground",
								)}
								onClick={() => setSelectedDate(date)}
							>
								<LiquidBorder />
								<span>{format(parseISO(date), "dd.MM")}</span>
								<p
									className={cn(
										"text-sm text-muted transition-colors",
										selectedDate === date && "text-accent-foreground",
									)}
								>
									{weekdays[new Date(date).getDay()]}
								</p>
							</button>
						</Touchable>
					))}
				</div>
			</div>
			<div className="relative">
				<div
					className="flex flex-col gap-2 max-h-64 overflow-scroll p-0.5 -m-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[scrollbar-width:auto] sm:[&::-webkit-scrollbar]:block"
					onScroll={handleScroll}
				>
					{filteredSchedule && filteredSchedule.length > 0 ? (
						filteredSchedule.map((lesson, i) => (
							<LessonCard
								key={i}
								lesson={lesson}
								isActive={isLessonActive(lesson, now)}
							/>
						))
					) : (
						<p className="text-sm text-muted">
							У этого кабинета нет расписания на этот день
						</p>
					)}
				</div>
				{filteredSchedule && filteredSchedule.length > 3 && (
					<>
						<motion.div
							key="top"
							animate={{ opacity: position !== "top" ? 1 : 0 }}
							className="absolute -top-0.5 -left-0.5 -right-0.5 min-h-12 bg-linear-to-b from-background to-transparent pointer-events-none"
						/>
						<motion.div
							key="bottom"
							animate={{ opacity: position !== "bottom" ? 1 : 0 }}
							className="absolute -bottom-0.5 -left-0.5 -right-0.5 min-h-12 bg-linear-to-t from-background to-transparent pointer-events-none"
						/>
					</>
				)}
			</div>
		</div>
	)
}
