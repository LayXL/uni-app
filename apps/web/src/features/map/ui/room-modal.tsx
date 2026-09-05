"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { orpc } from "@repo/orpc/react"
import { isRoom, type Room } from "@repo/shared/building-scheme"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { formatRoomTeacherSummary } from "../lib/format-room-teacher-summary"
import { RoomOpeningHours } from "./room-opening-hours"
import { RoomScheduleModal } from "./room-schedule-modal"

type RoomModalProps = {
	roomId?: number | null
	onClose: () => void
}

export const RoomModal = ({ roomId, onClose }: RoomModalProps) => {
	const [scheduleRoom, setScheduleRoom] = useState<Room | null>(null)
	const [isScheduleOpen, setIsScheduleOpen] = useState(false)
	const { openModal, setStartRoomId, setStart, setEndRoomId, setEnd } =
		useRouteBuilder(
			useShallow((state) => ({
				openModal: state.openModal,
				setStartRoomId: state.setStartRoomId,
				setStart: state.setStart,
				setEndRoomId: state.setEndRoomId,
				setEnd: state.setEnd,
			})),
		)
	const data = useMapData()

	const entity = useMemo(() => {
		if (roomId == null) return null
		return data.entities.find((e) => e.id === roomId) ?? null
	}, [data, roomId])
	const room = entity && isRoom(entity) ? entity : null

	const { data: hasSchedule } = useQuery({
		...orpc.schedule.getSchedule.queryOptions({
			input: room
				? { dates: getNextTwoWeeksDates(), classroomIds: [room.id] }
				: skipToken,
		}),
		select: (schedule) => schedule.length > 0,
	})
	const { data: teacherSummary } = useQuery({
		...orpc.schedule.getRoomTeachers.queryOptions({
			input: room ? { roomId: room.id } : skipToken,
		}),
		refetchInterval: room && hasSchedule ? 30_000 : false,
		select: formatRoomTeacherSummary,
	})

	const handleRouteSelect = (destination: "start" | "end") => {
		if (!entity) return

		const door = room?.doorsPosition?.[0]
		const point = {
			floor: entity.floorId,
			x: entity.position.x + (door?.x ?? 0),
			y: entity.position.y + (door?.y ?? 0),
		}

		if (destination === "start") {
			setStartRoomId(entity.id)
			setStart(point)
		} else {
			setEndRoomId(entity.id)
			setEnd(point)
		}

		openModal()
		onClose()
	}

	return (
		<>
			<ModalRoot isOpen={entity != null} onClose={onClose} hideBackdrop>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						{entity?.name && (
							<p className="text-2xl font-medium">{entity.name}</p>
						)}
						{entity?.description && <p>{entity.description}</p>}
					</div>

					<RoomOpeningHours roomId={room?.id} />
					{room && hasSchedule && (
						<Touchable>
							<button
								type="button"
								className="relative flex w-full items-center justify-between gap-3 rounded-3xl bg-card p-4 text-left font-medium"
								onClick={() => {
									setScheduleRoom(room)
									setIsScheduleOpen(true)
								}}
								aria-haspopup="dialog"
							>
								<LiquidBorder />
								<span className="flex min-w-0 flex-col gap-1">
									<span>Расписание кабинета</span>
									{teacherSummary && (
										<span className="text-sm font-normal text-muted">
											{teacherSummary}
										</span>
									)}
								</span>
								<Icon
									name="arrow-right-12"
									size={24}
									className="shrink-0 icon-secondary"
								/>
							</button>
						</Touchable>
					)}

					<div className="grid grid-cols-2 gap-2">
						<Button
							label="Отсюда"
							variant="secondary"
							leftIcon="iconify:material-symbols:near-me-rounded"
							onClick={() => handleRouteSelect("start")}
						/>
						<Button
							label="Сюда"
							leftIcon="iconify:material-symbols:flag-rounded"
							onClick={() => handleRouteSelect("end")}
						/>
					</div>
				</div>
			</ModalRoot>
			<RoomScheduleModal
				room={scheduleRoom}
				isOpen={isScheduleOpen}
				onClose={() => setIsScheduleOpen(false)}
			/>
		</>
	)
}
