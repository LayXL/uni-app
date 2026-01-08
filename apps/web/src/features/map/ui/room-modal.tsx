"use client"

import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { Button } from "@/shared/ui/button"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"

type RoomModalProps = {
	roomId: number
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

		return data.rooms.find((r) => r.id === roomId) ?? null
	}, [data, roomId])

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				{room?.name && <p className="text-2xl font-medium">{room.name}</p>}
				{room?.description && <p>{room.description}</p>}
			</div>

			<Button
				label="Проложить маршрут"
				leftIcon="location-map-outline-24"
				onClick={() => {
					if (!room) return

					const door = room.doorsPosition?.[0]

					setEndRoomId(roomId)
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
	)
}
