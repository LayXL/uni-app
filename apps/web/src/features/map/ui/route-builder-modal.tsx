import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { ModalRoot } from "@/shared/ui/modal-root"

import { useRouteBuilder } from "../hooks/use-route-builder"

export const RouteBuilderModal = () => {
	const { data: mapData } = useQuery(orpc.map.getMap.queryOptions())

	const {
		isModalOpen,
		startRoomId,
		endRoomId,
		setStartRoomId,
		setEndRoomId,
		setStart,
		setEnd,
		closeModal,
	} = useRouteBuilder()

	const [startRoomInput, setStartRoomInput] = useState(startRoomId)
	const [endRoomInput, setEndRoomInput] = useState(endRoomId)

	useEffect(() => {
		setStartRoomInput(startRoomId)
		setEndRoomInput(endRoomId)
	}, [startRoomId, endRoomId])

	return (
		<ModalRoot isOpen={isModalOpen} onClose={closeModal}>
			<div className="flex flex-col gap-2">
				<input
					className="bg-input border border-border rounded-xl p-3"
					type="text"
					value={startRoomInput ?? ""}
					onChange={(e) => setStartRoomInput(Number(e.target.value))}
				/>
				<input
					className="bg-input border border-border rounded-xl p-3"
					type="text"
					value={endRoomInput ?? ""}
					onChange={(e) => setEndRoomInput(Number(e.target.value))}
				/>
				<button
					type="button"
					onClick={() => {
						setStartRoomInput(endRoomInput)
						setEndRoomInput(startRoomInput)
					}}
				>
					Swap
				</button>
				<button
					type="button"
					onClick={() => {
						if (!startRoomInput || !endRoomInput) return

						const startRoom = mapData?.rooms.find(
							(room) => room.id === startRoomInput,
						)
						const endRoom = mapData?.rooms.find(
							(room) => room.id === endRoomInput,
						)

						if (!startRoom || !endRoom) return

						setStartRoomId(startRoomInput)
						setEndRoomId(endRoomInput)

						setStart({
							floor: startRoom.floorId,
							x: startRoom.position.x,
							y: startRoom.position.y,
						})
						setEnd({
							floor: endRoom.floorId,
							x: endRoom.position.x,
							y: endRoom.position.y,
						})

						closeModal()
					}}
				>
					Build Route
				</button>
			</div>
		</ModalRoot>
	)
}
