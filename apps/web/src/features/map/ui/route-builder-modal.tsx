import { useMemo, useState } from "react"

import type { MapEntity } from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { RouteBuilderSuggestions } from "./route-builder-suggestions"

type SearchInputTriggerProps = {
	icon: IconName
	value?: number
	placeholder?: string
	items: SearchInputItem<number>[]
	excludeKey?: number | null
	onChange: (id: number) => void
	filterFn: (item: SearchInputItem<number>, query: string) => boolean
	displayValue?: string
}

const SearchInputTrigger = ({
	icon,
	value,
	placeholder,
	items,
	excludeKey,
	onChange,
	filterFn,
	displayValue,
}: SearchInputTriggerProps) => {
	const [isOpen, setIsOpen] = useState(false)

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
							value && "text-foreground",
						)}
					>
						{displayValue ?? placeholder}
					</p>
				</button>
			</Touchable>
			{isOpen && (
				<div className="fixed inset-0 bg-background z-50 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
					<SearchInput
						autoFocus
						items={items.filter((item) => item.key !== excludeKey)}
						value={value}
						onChange={handleChange}
						filterFn={filterFn}
						placeholder={placeholder}
						maxSuggestions={8}
						emptyMessage="Место не найдено"
						onBlur={() => setIsOpen(false)}
					/>
				</div>
			)}
		</>
	)
}

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
			<div className="flex flex-col gap-4 justify-between">
				<div className="flex flex-col gap-4">
					<h2 className="text-2xl font-medium">Маршрут</h2>
					<div className="relative bg-card rounded-3xl">
						<LiquidBorder />
						<SearchInputTrigger
							icon="iconify:material-symbols:near-me-rounded"
							value={startRoomId ?? undefined}
							placeholder="Откуда"
							items={entityItems}
							excludeKey={endRoomId}
							onChange={handleStartSelect}
							filterFn={filterEntity}
							displayValue={
								entityItems.find((e) => e.key === startRoomId)?.value
							}
						/>
						<div className="h-px ml-12 mr-px bg-border" />
						<SearchInputTrigger
							icon="iconify:material-symbols:flag-rounded"
							value={endRoomId ?? undefined}
							placeholder="Куда"
							items={entityItems}
							excludeKey={startRoomId}
							onChange={handleEndSelect}
							filterFn={filterEntity}
							displayValue={entityItems.find((e) => e.key === endRoomId)?.value}
						/>
					</div>
					<RouteBuilderSuggestions
						handleStartSelect={handleStartSelect}
						handleEndSelect={handleEndSelect}
						setIsActive={setIsActive}
						closeModal={closeModal}
					/>
				</div>
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
