"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"

import { Button } from "@/shared/ui/button"

import { useRouteBuilder } from "../hooks/use-route-builder"

type RoomModalProps = {
	roomId: number
	onClose: () => void
}

export const RoomModal = ({ roomId, onClose }: RoomModalProps) => {
	const setEndRoomId = useRouteBuilder((state) => state.setEndRoomId)
	const { data } = useQuery(orpc.map.getMap.queryOptions())

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
					setEndRoomId(roomId)
					onClose()
				}}
			/>
		</div>
	)
}
