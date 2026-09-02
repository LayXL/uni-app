import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { isRoom, type MapEntity } from "@repo/shared/building-scheme"

import { analytics } from "@/shared/lib/analytics"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { usePopupClose } from "@/shared/ui/popup"
import { Portal } from "@/shared/ui/portal"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useMapData } from "../hooks/use-map-data"
import { useMapState } from "../hooks/use-map-state"
import { useSelectedRoom } from "../hooks/use-selected-room"
import { getRoomWorldCenter } from "../lib/geometry"
import { getEntitySearchDescription } from "../lib/get-entity-search-description"

type SearchInputTriggerProps = {
	icon: IconName
	value?: number
	placeholder: string
	items: SearchInputItem<number>[]
	onChange: (id: number) => void
	filterFn?: (item: SearchInputItem<number>, query: string) => boolean
}

const SearchInputTrigger = ({
	icon,
	value,
	placeholder,
	items,
	onChange,
	filterFn,
}: SearchInputTriggerProps) => {
	const [isOpen, setIsOpen] = useState(false)

	usePopupClose(isOpen, () => setIsOpen(false))

	const displayValue = items.find((item) => item.key === value)?.value

	const handleChange = (id: number) => {
		onChange(id)
		setIsOpen(false)
	}

	return (
		<>
			<Touchable>
				<button
					type="button"
					className="h-12 w-full flex items-center"
					onClick={() => setIsOpen(true)}
				>
					<div className="size-12 min-w-12 grid place-items-center pointer-events-none">
						<Icon name={icon} size={24} />
					</div>
					<p
						className={cn(
							"text-muted rounded-3xl line-clamp-1 w-full break-all pr-4",
							displayValue && "text-foreground",
						)}
					>
						{displayValue ?? placeholder}
					</p>
				</button>
			</Touchable>
			{isOpen && (
				<Portal>
					<div className="fixed inset-0 bg-background z-50 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
						<SearchInput
							autoFocus
							items={items}
							value={value}
							onChange={handleChange}
							filterFn={filterFn}
							placeholder={placeholder}
							maxSuggestions={8}
							emptyMessage="Место не найдено"
							onBlur={() => setIsOpen(false)}
						/>
					</div>
				</Portal>
			)}
		</>
	)
}

type MapSearchModalProps = {
	isOpen: boolean
	onClose: () => void
}

export const MapSearchModal = ({ isOpen, onClose }: MapSearchModalProps) => {
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
		if (isRoom(entity)) {
			const center = getRoomWorldCenter(entity, floor)
			moveTo(center.x, center.y)
		} else {
			moveTo(
				floor.position.x + entity.position.x,
				floor.position.y + entity.position.y,
			)
		}

		onClose()
	}

	return (
		<ModalRoot isOpen={isOpen} onClose={onClose}>
			<div className="flex flex-col gap-4">
				<h2 className="text-2xl font-medium">Поиск</h2>
				<div className="relative bg-card rounded-3xl">
					<LiquidBorder />
					<SearchInputTrigger
						icon="iconify:material-symbols:search-rounded"
						placeholder="Найти аудиторию или место"
						items={entityItems}
						onChange={handleSelect}
						filterFn={filterEntity}
					/>
				</div>
			</div>
		</ModalRoot>
	)
}
