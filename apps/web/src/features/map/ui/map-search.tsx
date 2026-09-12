import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { isRoom, type MapEntity } from "@repo/shared/building-scheme"

import { useCloudStorage } from "@/shared/hooks/use-cloud-storage"
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

const MAX_RECENT_PLACES = 20

export const MapSearch = () => {
	const mapData = useMapData()
	const [recentPlaceIds, setRecentPlaceIds] = useCloudStorage<number[]>(
		"recent-map-places",
		[],
	)
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
		const recentRanks = new Map(
			(recentPlaceIds ?? []).map((id, index) => [id, index]),
		)
		const defaultRank = recentRanks.size

		return entities
			.filter((entity) => !entity.hiddenInSearch && entity.name)
			.sort(
				(a, b) =>
					(recentRanks.get(a.id) ?? defaultRank) -
						(recentRanks.get(b.id) ?? defaultRank) ||
					(b.priority ?? 0) - (a.priority ?? 0),
			)
			.map((entity) => ({
				key: entity.id,
				value: entity.name,
				description: getEntitySearchDescription(entity, mapData.floors),
			}))
	}, [entities, mapData.floors, recentPlaceIds])

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

		setRecentPlaceIds(
			[
				entityId,
				...(recentPlaceIds ?? []).filter((id) => id !== entityId),
			].slice(0, MAX_RECENT_PLACES),
		)

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
		<div className="relative min-w-0 flex-1 bg-card rounded-3xl">
			<SearchInputTrigger
				className="bg-card rounded-3xl"
				icon="iconify:material-symbols:search-rounded"
				placeholder="Найти аудиторию или место"
				items={entityItems}
				onChange={handleSelect}
				filterFn={filterEntity}
			/>
			<LiquidBorder />
		</div>
	)
}
