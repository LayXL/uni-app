"use client"

import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { isRoom } from "@repo/shared/building-scheme"

import { Button } from "@/shared/ui/button"
import { ModalRoot } from "@/shared/ui/modal-root"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"

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

	return (
		<ModalRoot isOpen={roomId !== null} onClose={onClose}>
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
