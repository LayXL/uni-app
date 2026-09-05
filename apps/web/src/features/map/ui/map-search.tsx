import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { isRoom, type MapEntity } from "@repo/shared/building-scheme"

import { analytics } from "@/shared/lib/analytics"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import type { SearchInputItem } from "@/shared/ui/search-input"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useMapData } from "../hooks/use-map-data"
import { useMapState } from "../hooks/use-map-state"
import { useSelectedRoom } from "../hooks/use-selected-room"
import { getEntitySearchDescription } from "../lib/get-entity-search-description"
import { entityCenter } from "../lib/indoor-geometry"
import { SearchInputTrigger } from "./search-input-trigger"

export const MapSearch = () => {
	const mapData = useMapData()
	const { setActiveFloor } = useActiveFloor()
	const { setSelectedRoomId } = useSelectedRoom()
	const { moveTo, setZoom } = useMapState(
		useShallow((state) => ({
			moveTo: state.moveTo,
			setZoom: state.setZoom,
		})),
	)

	const entities = useMemo<MapEntity[]>(() => {
		if (!mapData?.entities) return []
		return mapData.entities
	}, [mapData?.entities])

	const entityItems = useMemo<SearchInputItem<number>[]>(() => {
		return entities
			.filter((entity) => !entity.hiddenInSearch && entity.name)
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
			.map((entity) => ({
				key: entity.id,
				value: entity.name,
				description: getEntitySearchDescription(entity, mapData.floors),
			}))
	}, [entities, mapData.floors])

	const filterEntity = (item: SearchInputItem<number>, query: string) => {
		const entity = entities.find((e) => e.id === item.key)
		const q = query.toLowerCase()

		return (
			item.value.toLowerCase().includes(q) ||
			item.description?.toLowerCase().includes(q) ||
			entity?.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
			false
		)
	}

	const handleSelect = (entityId: number) => {
		const entity = entities.find((e) => e.id === entityId)
		const floor = mapData.floors.find((floor) => floor.id === entity?.floorId)
		if (!entity || !floor) return

		if (isRoom(entity)) {
			analytics.track("room_searched", {
				room_id: entity.id,
				room_name: entity.name,
				floor_id: entity.floorId,
				source: "map_search",
			})
		}

		setActiveFloor(entity.floorId)
		setSelectedRoomId(entityId)

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		})

		setZoom(0.5)
		const center = entityCenter(entity, floor)
		moveTo(center.x, center.y)
	}

	return (
		<div className="relative min-w-0 flex-1 bg-background rounded-3xl">
			<LiquidBorder />
			<SearchInputTrigger
				icon="iconify:material-symbols:search-rounded"
				placeholder="Найти аудиторию или место"
				items={entityItems}
				onChange={handleSelect}
				filterFn={filterEntity}
			/>
		</div>
	)
}
