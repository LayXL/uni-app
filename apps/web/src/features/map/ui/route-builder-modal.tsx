import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import type { Room } from "@repo/shared/building-scheme"

import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { ModalRoot } from "@/shared/ui/modal-root"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

import { useRouteBuilder } from "../hooks/use-route-builder"

type Point = { floor: number; x: number; y: number }

const createRoomSelectHandler =
	(
		rooms: Room[] | undefined,
		setRoomId: (id: number) => void,
		setPosition: (point: Point) => void,
	) =>
	(roomId: number) => {
		const room = rooms?.find((r) => r.id === roomId)
		if (!room) return

		const door = room.doorsPosition?.[0]

		setRoomId(roomId)
		setPosition({
			floor: room.floorId,
			x: door ? room.position.x + door.x : room.position.x,
			y: door ? room.position.y + door.y : room.position.y,
		})
	}

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
		setIsActive,
	} = useRouteBuilder()

	const roomItems = useMemo<SearchInputItem<number>[]>(() => {
		if (!mapData?.rooms) return []

		return mapData.rooms
			.filter((room) => !room.hiddenInSearch && room.name)
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
			.map((room) => ({ key: room.name, value: room.id }))
	}, [mapData?.rooms])

	const filterRoom = (item: SearchInputItem<number>, query: string) => {
		const room = mapData?.rooms.find((r) => r.id === item.value)
		const q = query.toLowerCase()

		return (
			item.key.toLowerCase().includes(q) ||
			room?.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
			false
		)
	}

	const handleStartSelect = createRoomSelectHandler(
		mapData?.rooms,
		setStartRoomId,
		setStart,
	)
	const handleEndSelect = createRoomSelectHandler(
		mapData?.rooms,
		setEndRoomId,
		setEnd,
	)

	return (
		<ModalRoot isOpen={isModalOpen} onClose={closeModal}>
			<div className="flex flex-col gap-4">
				<h2 className="text-2xl font-medium">Маршрут</h2>
				<div className="bg-popover border border-border rounded-xl relative">
					<div className="relative">
						<div className="absolute size-12 grid place-items-center pointer-events-none z-10">
							<Icon name="location-16" size={16} />
						</div>
						<SearchInput
							items={roomItems}
							value={startRoomId ?? undefined}
							onChange={handleStartSelect}
							filterFn={filterRoom}
							placeholder="Откуда"
							maxSuggestions={8}
							emptyMessage="Комната не найдена"
							className="bg-transparent border-none rounded-xl pl-12 h-12"
						/>
					</div>
					<div className="h-px w-full bg-border" />
					<div className="relative">
						<div className="absolute size-12 grid place-items-center pointer-events-none z-10">
							<Icon name="location-map-outline-20" size={16} />
						</div>
						<SearchInput
							items={roomItems}
							value={endRoomId ?? undefined}
							onChange={handleEndSelect}
							filterFn={filterRoom}
							placeholder="Куда"
							maxSuggestions={8}
							emptyMessage="Комната не найдена"
							className="bg-transparent border-none rounded-xl pl-12 h-12"
						/>
					</div>
				</div>
				<div className="h-32" />
				<Button
					onClick={() => {
						setIsActive(true)
						closeModal()
					}}
					disabled={!startRoomId || !endRoomId}
					label="Построить маршрут"
				/>
			</div>
		</ModalRoot>
	)
}
