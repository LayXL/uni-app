import { useMemo } from "react"

import type { MapEntity } from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { ModalRoot } from "@/shared/ui/modal-root"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { RouteBuilderSuggestions } from "./route-builder-suggestions"

type Point = { floor: number; x: number; y: number }

export type CreateEntitySelectHandler = (
	entities: MapEntity[] | undefined,
	setEntityId: (id: number) => void,
	setPosition: (point: Point) => void,
) => (entityId: number) => void

const createEntitySelectHandler: CreateEntitySelectHandler =
	(entities, setEntityId, setPosition) => (entityId) => {
		const entity = entities?.find((e) => e.id === entityId)
		if (!entity) return

		setEntityId(entityId)

		if (isRoom(entity)) {
			const door = entity.doorsPosition?.[0]
			setPosition({
				floor: entity.floorId,
				x: door ? entity.position.x + door.x : entity.position.x,
				y: door ? entity.position.y + door.y : entity.position.y,
			})
		} else {
			setPosition({
				floor: entity.floorId,
				x: entity.position.x,
				y: entity.position.y,
			})
		}
	}

export const RouteBuilderModal = () => {
	const mapData = useMapData()

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

	const entities = useMemo<MapEntity[]>(() => {
		if (!mapData?.entities) return []
		return mapData.entities
	}, [mapData?.entities])

	const entityItems = useMemo<SearchInputItem<number>[]>(() => {
		return entities
			.filter((entity) => !entity.hiddenInSearch && entity.name)
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
			.map((entity) => ({ key: entity.id, value: entity.name }))
	}, [entities])

	const filterEntity = (item: SearchInputItem<number>, query: string) => {
		const entity = entities.find((e) => e.id === item.key)
		const q = query.toLowerCase()

		return (
			item.value.toLowerCase().includes(q) ||
			entity?.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
			false
		)
	}

	const handleStartSelect = createEntitySelectHandler(
		entities,
		setStartRoomId,
		setStart,
	)
	const handleEndSelect = createEntitySelectHandler(
		entities,
		setEndRoomId,
		setEnd,
	)

	return (
		<ModalRoot isOpen={isModalOpen} onClose={closeModal}>
			<div className="flex flex-col gap-4">
				<h2 className="text-2xl font-medium">Маршрут</h2>
				<div className="bg-card border border-border rounded-3xl relative">
					<div className="relative">
						<div className="absolute size-12 grid place-items-center pointer-events-none z-10">
							<Icon name="iconify:material-symbols:near-me-rounded" size={24} />
						</div>
						<SearchInput
							items={entityItems.filter((item) => item.key !== endRoomId)}
							value={startRoomId ?? undefined}
							onChange={handleStartSelect}
							filterFn={filterEntity}
							placeholder="Откуда"
							maxSuggestions={8}
							emptyMessage="Место не найдено"
							className="bg-transparent border-none rounded-3xl pl-12 h-12"
						/>
					</div>
					<div className="h-px ml-13 bg-border" />
					<div className="relative">
						<div className="absolute size-12 grid place-items-center pointer-events-none z-10">
							<Icon name="iconify:material-symbols:flag-rounded" size={24} />
						</div>
						<SearchInput
							items={entityItems.filter((item) => item.key !== startRoomId)}
							value={endRoomId ?? undefined}
							onChange={handleEndSelect}
							filterFn={filterEntity}
							placeholder="Куда"
							maxSuggestions={8}
							emptyMessage="Место не найдено"
							className="bg-transparent border-none rounded-3xl pl-12 h-12"
						/>
					</div>
				</div>
				<RouteBuilderSuggestions
					handleStartSelect={handleStartSelect}
					handleEndSelect={handleEndSelect}
					setIsActive={setIsActive}
					closeModal={closeModal}
				/>
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
