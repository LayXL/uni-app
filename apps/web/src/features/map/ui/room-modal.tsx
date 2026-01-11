"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { orpc } from "@repo/orpc/react"
import { isRoom } from "@repo/shared/building-scheme"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { Button } from "@/shared/ui/button"
import { ModalRoot } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"

const weekdays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]

type RoomModalProps = {
	roomId?: number | null
	onClose: () => void
}

export const RoomModal = ({ roomId, onClose }: RoomModalProps) => {
	const { openModal, setEndRoomId, setEnd } = useRouteBuilder(
		useShallow((state) => ({
			openModal: state.openModal,
			setEndRoomId: state.setEndRoomId,
			setEnd: state.setEnd,
		})),
	)
	const data = useMapData()

	const room = useMemo(() => {
		if (!roomId || !data) return null

		const entity = data.entities.find((e) => e.id === roomId)
		if (!entity || !isRoom(entity)) return null

		return entity
	}, [data, roomId])

	const [selectedDate, setSelectedDate] = useState<string>(
		getNextTwoWeeksDates()[0],
	)

	const mayHaveSchedule = useMemo(() => room?.name.match(/\d{3}/g), [room])

	const { data: schedule } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input:
				mayHaveSchedule && room
					? {
							dates: getNextTwoWeeksDates(),
							classrooms: [room.name],
						}
					: skipToken,
		}),
	)

	const filteredSchedule = useMemo(() => {
		if (!schedule) return []

		return schedule.filter((lesson) => lesson.date === selectedDate)
	}, [schedule, selectedDate])

	return (
		<ModalRoot isOpen={roomId !== null} onClose={onClose}>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					{room?.name && <p className="text-2xl font-medium">{room.name}</p>}
					{room?.description && <p>{room.description}</p>}
				</div>

				{mayHaveSchedule && (
					<div className="flex flex-col gap-2">
						<p className="text-lg font-medium">Расписание кабинета</p>
						<div className="grid overflow-scroll -mx-4 px-4">
							<div className="flex flex-row gap-1 w-full">
								{getNextTwoWeeksDates().map((date) => (
									<Touchable key={date}>
										<button
											type="button"
											className={cn(
												"bg-card border border-border rounded-3xl px-3 py-2 flex gap-1 items-end transition-colors",
												selectedDate === date &&
													"bg-accent text-accent-foreground",
											)}
											onClick={() => setSelectedDate(date)}
										>
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
						<div className="flex flex-col gap-2 max-h-64 overflow-scroll">
							{filteredSchedule && filteredSchedule.length > 0 ? (
								filteredSchedule.map((lesson, i) => (
									<LessonCard key={i} lesson={lesson} />
								))
							) : (
								<p className="text-sm text-muted">
									У этого кабинета нет расписания на этот день
								</p>
							)}
						</div>
					</div>
				)}

				<Button
					label="Проложить маршрут"
					leftIcon="location-map-outline-24"
					onClick={() => {
						if (!room) return

						const door = room.doorsPosition?.[0]

						setEndRoomId(room.id)
						setEnd({
							floor: room.floorId,
							x: door ? room.position.x + door.x : room.position.x,
							y: door ? room.position.y + door.y : room.position.y,
						})
						openModal()
						onClose()
					}}
				/>
			</div>
		</ModalRoot>
	)
}
