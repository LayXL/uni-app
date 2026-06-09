"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type {
	BuildingScheme,
	Coordinate,
	Floor,
	Road,
	Room,
} from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

import { useMapData } from "@/features/map/hooks/use-map-data"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { PageTitle } from "@/shared/ui/page-title"
import { cn } from "@/shared/utils/cn"

type EditorTool = "preview" | "floor" | "rooms" | "doors" | "stairs" | "roads"
type DragTarget =
	| { kind: "floor"; pointIndex: number }
	| { kind: "room"; roomId: number; pointIndex: number }

const tools: { id: EditorTool; label: string; hint: string }[] = [
	{ id: "preview", label: "Предпросмотр", hint: "Проверка итогового плана" },
	{ id: "floor", label: "Стены этажа", hint: "Перетаскивайте углы контура" },
	{ id: "rooms", label: "Аудитории", hint: "Выберите и измените аудиторию" },
	{ id: "doors", label: "Двери", hint: "Нажмите внутри выбранной аудитории" },
	{ id: "stairs", label: "Лестницы", hint: "Нажмите на плане, чтобы добавить" },
	{ id: "roads", label: "Дороги", hint: "Укажите начало и конец отрезка" },
]

const cloneScheme = (scheme: BuildingScheme): BuildingScheme =>
	JSON.parse(JSON.stringify(scheme)) as BuildingScheme

const getBounds = (floor: Floor, rooms: Room[]) => {
	const points = [
		...floor.wallsPosition.map((point) => ({
			x: point.x + floor.position.x,
			y: point.y + floor.position.y,
		})),
		...rooms.flatMap((room) =>
			room.wallsPosition.map((point) => ({
				x: point.x + floor.position.x + room.position.x,
				y: point.y + floor.position.y + room.position.y,
			})),
		),
	]

	if (!points.length) return { x: 0, y: 0, width: 1000, height: 700 }

	const minX = Math.min(...points.map((point) => point.x))
	const maxX = Math.max(...points.map((point) => point.x))
	const minY = Math.min(...points.map((point) => point.y))
	const maxY = Math.max(...points.map((point) => point.y))
	const padding = 80

	return {
		x: minX - padding,
		y: minY - padding,
		width: Math.max(maxX - minX + padding * 2, 100),
		height: Math.max(maxY - minY + padding * 2, 100),
	}
}

const toPoints = (points: Coordinate[], offset: Coordinate) =>
	points.map((point) => `${point.x + offset.x},${point.y + offset.y}`).join(" ")

const ToolButton = ({
	active,
	label,
	onClick,
}: {
	active: boolean
	label: string
	onClick: () => void
}) => (
	<button
		type="button"
		onClick={onClick}
		className={cn(
			"shrink-0 rounded-3xl px-4 py-2.5 text-sm font-medium transition-colors",
			active ? "bg-accent text-accent-foreground" : "bg-card",
		)}
	>
		{label}
	</button>
)

export const MapEditor = () => {
	const mapData = useMapData()
	const [scheme, setScheme] = useState(() => cloneScheme(mapData))
	const [activeFloorId, setActiveFloorId] = useState(mapData.floors[0]?.id ?? 0)
	const [activeTool, setActiveTool] = useState<EditorTool>("preview")
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
	const [roadStart, setRoadStart] = useState<Coordinate | null>(null)
	const [dragTarget, setDragTarget] = useState<DragTarget | null>(null)
	const [hasChanges, setHasChanges] = useState(false)
	const svgRef = useRef<SVGSVGElement | null>(null)

	useEffect(() => {
		const draft = localStorage.getItem("map-editor-draft")
		if (!draft) return

		try {
			setScheme(JSON.parse(draft) as BuildingScheme)
		} catch {
			localStorage.removeItem("map-editor-draft")
		}
	}, [])

	const activeFloor =
		scheme.floors.find((floor) => floor.id === activeFloorId) ??
		scheme.floors[0]
	const rooms = useMemo(
		() =>
			scheme.entities.filter(
				(entity): entity is Room =>
					isRoom(entity) && entity.floorId === activeFloor?.id,
			),
		[activeFloor?.id, scheme.entities],
	)
	const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null
	const bounds = activeFloor
		? getBounds(activeFloor, rooms)
		: { x: 0, y: 0, width: 1000, height: 700 }
	const activeToolInfo =
		tools.find((tool) => tool.id === activeTool) ?? tools[0]

	const updateScheme = (updater: (draft: BuildingScheme) => void) => {
		setScheme((current) => {
			const draft = cloneScheme(current)
			updater(draft)
			return draft
		})
		setHasChanges(true)
	}

	const toWorldPoint = (clientX: number, clientY: number) => {
		const svg = svgRef.current
		if (!svg) return null
		const point = svg.createSVGPoint()
		point.x = clientX
		point.y = clientY
		const matrix = svg.getScreenCTM()?.inverse()
		if (!matrix) return null
		const transformed = point.matrixTransform(matrix)
		return { x: transformed.x, y: transformed.y }
	}

	const toFloorPoint = (point: Coordinate) => ({
		x: Math.round(point.x - (activeFloor?.position.x ?? 0)),
		y: Math.round(point.y - (activeFloor?.position.y ?? 0)),
	})

	const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
		if (!activeFloor || dragTarget) return
		const worldPoint = toWorldPoint(event.clientX, event.clientY)
		if (!worldPoint) return
		const floorPoint = toFloorPoint(worldPoint)

		if (activeTool === "stairs") {
			updateScheme((draft) => {
				const floor = draft.floors.find((item) => item.id === activeFloor.id)
				if (!floor) return
				const nextId =
					Math.max(0, ...(floor.stairs ?? []).map((item) => item.id)) + 1
				floor.stairs = [
					...(floor.stairs ?? []),
					{ id: nextId, floors: [floor.id], position: floorPoint },
				]
			})
		}

		if (activeTool === "roads") {
			if (!roadStart) {
				setRoadStart(floorPoint)
				return
			}
			updateScheme((draft) => {
				const floor = draft.floors.find((item) => item.id === activeFloor.id)
				if (!floor) return
				floor.roads = [
					...(floor.roads ?? []),
					{ start: roadStart, end: floorPoint },
				]
			})
			setRoadStart(null)
		}

		if (activeTool === "doors" && selectedRoom) {
			updateScheme((draft) => {
				const room = draft.entities.find(
					(entity): entity is Room =>
						isRoom(entity) && entity.id === selectedRoom.id,
				)
				if (!room) return
				room.doorsPosition = [
					...(room.doorsPosition ?? []),
					{
						x: floorPoint.x - room.position.x,
						y: floorPoint.y - room.position.y,
					},
				]
			})
		}
	}

	const movePoint = (event: React.PointerEvent<SVGSVGElement>) => {
		if (!dragTarget || !activeFloor) return
		const worldPoint = toWorldPoint(event.clientX, event.clientY)
		if (!worldPoint) return
		const floorPoint = toFloorPoint(worldPoint)

		updateScheme((draft) => {
			if (dragTarget.kind === "floor") {
				const floor = draft.floors.find((item) => item.id === activeFloor.id)
				if (floor) floor.wallsPosition[dragTarget.pointIndex] = floorPoint
				return
			}

			const room = draft.entities.find(
				(entity): entity is Room =>
					isRoom(entity) && entity.id === dragTarget.roomId,
			)
			if (room) {
				room.wallsPosition[dragTarget.pointIndex] = {
					x: floorPoint.x - room.position.x,
					y: floorPoint.y - room.position.y,
				}
			}
		})
	}

	const removeLast = () => {
		if (!activeFloor) return
		updateScheme((draft) => {
			const floor = draft.floors.find((item) => item.id === activeFloor.id)
			if (!floor) return

			if (activeTool === "roads") floor.roads?.pop()
			if (activeTool === "stairs") floor.stairs?.pop()
			if (activeTool === "floor" && floor.wallsPosition.length > 3)
				floor.wallsPosition.pop()
			if (activeTool === "rooms" && selectedRoom) {
				const room = draft.entities.find(
					(entity): entity is Room =>
						isRoom(entity) && entity.id === selectedRoom.id,
				)
				if (room && room.wallsPosition.length > 3) room.wallsPosition.pop()
			}
			if (activeTool === "doors" && selectedRoom) {
				const room = draft.entities.find(
					(entity): entity is Room =>
						isRoom(entity) && entity.id === selectedRoom.id,
				)
				room?.doorsPosition?.pop()
			}
		})
	}

	const saveDraft = () => {
		localStorage.setItem("map-editor-draft", JSON.stringify(scheme))
		setHasChanges(false)
	}

	const resetDraft = () => {
		setScheme(cloneScheme(mapData))
		setSelectedRoomId(null)
		setRoadStart(null)
		setHasChanges(false)
		localStorage.removeItem("map-editor-draft")
	}

	if (!activeFloor) return null

	return (
		<div className="min-h-screen p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<PageTitle title="Редактирование карты" />
						<p className="-mt-3 text-sm text-muted">
							Изменения сохраняются как черновик на этом устройстве
						</p>
					</div>
					<Button
						label={hasChanges ? "Сохранить черновик" : "Черновик сохранён"}
						leftIcon="iconify:material-symbols:check-circle"
						disabled={!hasChanges}
						onClick={saveDraft}
						className="w-full sm:w-auto"
					/>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-1">
					{scheme.floors.map((floor) => (
						<ToolButton
							key={floor.id}
							active={floor.id === activeFloor.id}
							label={floor.acronym ?? floor.name}
							onClick={() => {
								setActiveFloorId(floor.id)
								setSelectedRoomId(null)
								setRoadStart(null)
							}}
						/>
					))}
				</div>

				<div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
					<aside className="relative order-2 rounded-3xl bg-card p-3 lg:order-1">
						<LiquidBorder />
						<p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
							Инструменты
						</p>
						<div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
							{tools.map((tool) => (
								<button
									key={tool.id}
									type="button"
									onClick={() => {
										setActiveTool(tool.id)
										setRoadStart(null)
									}}
									className={cn(
										"rounded-2xl p-3 text-left transition-colors",
										activeTool === tool.id
											? "bg-accent text-accent-foreground"
											: "bg-background",
									)}
								>
									<span className="block text-sm font-medium">
										{tool.label}
									</span>
									<span
										className={cn(
											"mt-0.5 block text-xs",
											activeTool === tool.id
												? "text-accent-foreground/75"
												: "text-muted",
										)}
									>
										{tool.hint}
									</span>
								</button>
							))}
						</div>
						<div className="mt-3 flex flex-col gap-2">
							<Button
								variant="primary"
								size="sm"
								label="Удалить последний"
								leftIcon="iconify:material-symbols:delete-outline"
								onClick={removeLast}
							/>
							<Button
								variant="secondary"
								size="sm"
								label="Сбросить черновик"
								onClick={resetDraft}
							/>
						</div>
					</aside>

					<section className="order-1 overflow-hidden rounded-3xl bg-card lg:order-2">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
							<div>
								<p className="font-medium">{activeFloor.name}</p>
								<p className="text-xs text-muted">
									{activeToolInfo.hint}
									{selectedRoom ? ` · ${selectedRoom.name}` : ""}
								</p>
							</div>
							<div className="flex items-center gap-2 text-xs text-muted">
								<span>{rooms.length} аудиторий</span>
								<span>·</span>
								<span>{activeFloor.roads?.length ?? 0} дорог</span>
							</div>
						</div>

						<div className="relative h-[58vh] min-h-105 bg-(--map-background)">
							<svg
								ref={svgRef}
								viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
								className="size-full touch-none"
								onClick={handleCanvasClick}
								onPointerMove={movePoint}
								onPointerUp={() => setDragTarget(null)}
								onPointerLeave={() => setDragTarget(null)}
							>
								<title>Интерактивный план этажа</title>
								<polygon
									points={toPoints(
										activeFloor.wallsPosition,
										activeFloor.position,
									)}
									fill="var(--map-floor-fill)"
									stroke="var(--map-floor-stroke)"
									strokeWidth="4"
									strokeLinejoin="round"
								/>

								{activeFloor.roads?.map((road: Road, index) => (
									<line
										key={`${road.start.x}-${road.start.y}-${index}`}
										x1={road.start.x + activeFloor.position.x}
										y1={road.start.y + activeFloor.position.y}
										x2={road.end.x + activeFloor.position.x}
										y2={road.end.y + activeFloor.position.y}
										stroke="var(--map-route)"
										strokeWidth={activeTool === "roads" ? 5 : 3}
										strokeDasharray={
											activeTool === "preview" ? undefined : "10 8"
										}
										strokeLinecap="round"
										opacity={activeTool === "preview" ? 0.45 : 0.9}
									/>
								))}

								{rooms.map((room) => {
									const offset = {
										x: activeFloor.position.x + room.position.x,
										y: activeFloor.position.y + room.position.y,
									}
									const selected = selectedRoomId === room.id
									const center = room.wallsPosition.reduce(
										(total, point) => ({
											x: total.x + point.x / room.wallsPosition.length,
											y: total.y + point.y / room.wallsPosition.length,
										}),
										offset,
									)

									return (
										<g key={room.id}>
											<polygon
												points={toPoints(room.wallsPosition, offset)}
												fill="var(--map-room-fill)"
												stroke={
													selected ? "var(--accent)" : "var(--map-room-stroke)"
												}
												strokeWidth={selected ? 5 : 2}
												strokeLinejoin="round"
												role="button"
												aria-disabled={
													activeTool !== "rooms" && activeTool !== "doors"
												}
												tabIndex={
													activeTool === "rooms" || activeTool === "doors"
														? 0
														: undefined
												}
												onClick={(event) => {
													if (
														activeTool === "rooms" ||
														activeTool === "doors"
													) {
														event.stopPropagation()
														setSelectedRoomId(room.id)
													}
												}}
												onKeyDown={(event) => {
													if (
														(activeTool === "rooms" ||
															activeTool === "doors") &&
														(event.key === "Enter" || event.key === " ")
													) {
														event.preventDefault()
														setSelectedRoomId(room.id)
													}
												}}
												className={
													activeTool === "rooms" || activeTool === "doors"
														? "cursor-pointer"
														: undefined
												}
											/>
											<text
												x={center.x}
												y={center.y}
												textAnchor="middle"
												dominantBaseline="middle"
												fill="var(--map-room-label)"
												fontSize="18"
												className="pointer-events-none font-medium"
											>
												{room.name}
											</text>
											{room.doorsPosition?.map((door, index) => (
												<circle
													key={`${door.x}-${door.y}-${index}`}
													cx={door.x + offset.x}
													cy={door.y + offset.y}
													r={activeTool === "doors" ? 9 : 6}
													fill="var(--accent)"
													stroke="var(--map-background)"
													strokeWidth="3"
												/>
											))}
											{activeTool === "rooms" &&
												selected &&
												room.wallsPosition.map((point, index) => (
													<circle
														key={`${point.x}-${point.y}-${index}`}
														cx={point.x + offset.x}
														cy={point.y + offset.y}
														r="10"
														fill="var(--accent)"
														stroke="var(--map-background)"
														strokeWidth="4"
														className="cursor-grab"
														onPointerDown={(event) => {
															event.stopPropagation()
															setDragTarget({
																kind: "room",
																roomId: room.id,
																pointIndex: index,
															})
														}}
													/>
												))}
										</g>
									)
								})}

								{activeFloor.stairs?.map((stair) => (
									<g
										key={stair.id}
										transform={`translate(${stair.position.x + activeFloor.position.x} ${stair.position.y + activeFloor.position.y})`}
									>
										<circle
											r={activeTool === "stairs" ? 18 : 14}
											fill="var(--map-background)"
											stroke="var(--accent)"
											strokeWidth="4"
										/>
										<path
											d="M -8 7 H -3 V 2 H 2 V -3 H 8"
											fill="none"
											stroke="var(--map-stairs-icon)"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</g>
								))}

								{activeTool === "floor" &&
									activeFloor.wallsPosition.map((point, index) => (
										<circle
											key={`${point.x}-${point.y}-${index}`}
											cx={point.x + activeFloor.position.x}
											cy={point.y + activeFloor.position.y}
											r="11"
											fill="var(--accent)"
											stroke="var(--map-background)"
											strokeWidth="4"
											className="cursor-grab"
											onPointerDown={(event) => {
												event.stopPropagation()
												setDragTarget({ kind: "floor", pointIndex: index })
											}}
										/>
									))}

								{roadStart && (
									<circle
										cx={roadStart.x + activeFloor.position.x}
										cy={roadStart.y + activeFloor.position.y}
										r="10"
										fill="var(--accent)"
										stroke="var(--map-background)"
										strokeWidth="4"
									/>
								)}
							</svg>

							<div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-3xl bg-card/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
								<Icon name="iconify:material-symbols:edit-outline" size={16} />
								{activeToolInfo.label}
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	)
}
