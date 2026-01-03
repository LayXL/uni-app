"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"

import { Button } from "@/shared/ui/button"

type RoomModalProps = {
	roomId: number | null
}

export const RoomModal = ({ roomId }: RoomModalProps) => {
	const { data } = useQuery(orpc.map.getMap.queryOptions())

	const room = useMemo(() => {
		if (!roomId || !data) return null

		for (const floor of data) {
			for (const room of floor.rooms ?? []) {
				if (room.id === roomId) {
					return room
				}
			}
		}

		return null
	}, [data, roomId])

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				{room?.name && <p className="text-2xl font-medium">{room.name}</p>}
				{room?.description && <p>{room.description}</p>}
			</div>

			<Button label="Проложить маршрут" leftIcon="location-map-outline-24" />
		</div>
	)
}
