"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"
import type {
	BuildingScheme,
	Coordinate,
	Floor,
	Road,
	Room,
	Stair,
} from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"
import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

import { Button } from "@/shared/ui/button"
import { useConfirmDialog } from "@/shared/ui/confirm-dialog"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { PageTitle } from "@/shared/ui/page-title"
import { cn } from "@/shared/utils/cn"

type EditorTool = "preview" | "floor" | "rooms" | "doors" | "stairs" | "roads"
type DragTarget =
	| { kind: "floor"; pointIndex: number }
	| { kind: "room"; roomId: number; pointIndex: number }
	| { kind: "road"; roadIndex: number; endpoint: "start" | "end" }
type Campus = "university" | "school"
type SelectedObject =
	| { kind: "floor" }
	| { kind: "room"; roomId: number }
	| { kind: "road"; roadIndex: number }
	| { kind: "stair"; stairId: number }

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

const getFloorNumber = (floor: Floor) =>
	Number((floor.acronym ?? floor.name).match(/\d+/)?.[0] ?? floor.id)

const getCampusFloors = (scheme: BuildingScheme, campus: Campus) =>
	scheme.floors
		.filter(
			(floor) =>
				floor.name.toLowerCase().includes("школы") === (campus === "school"),
		)
		.toSorted((left, right) => getFloorNumber(left) - getFloorNumber(right))
		.slice(0, campus === "school" ? 3 : 4)

const JsonEditor = ({
	label,
	value,
	onApply,
}: {
	label: string
	value: unknown
	onApply: (value: unknown) => void
}) => {
	const [json, setJson] = useState(() => JSON.stringify(value, null, 2))
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setJson(JSON.stringify(value, null, 2))
		setError(null)
	}, [value])

	const apply = () => {
		try {
			onApply(JSON.parse(json))
			setError(null)
		} catch {
			setError("JSON или структура объекта содержит ошибку")
		}
	}

	return (
		<div className="relative rounded-3xl bg-card p-3">
			<LiquidBorder />
			<div className="mb-2 flex items-center justify-between gap-2">
				<div>
					<p className="text-sm font-medium">JSON: {label}</p>
					<p className="text-xs text-muted">
						Можно менять название, координаты и другие свойства
					</p>
				</div>
				<Button size="sm" label="Применить" onClick={apply} />
			</div>
			<textarea
				value={json}
				onChange={(event) => setJson(event.target.value)}
				spellCheck={false}
				className="h-64 w-full resize-y rounded-2xl border border-border bg-background p-3 font-mono text-xs outline-none"
			/>
			{error && <p className="mt-2 text-xs text-destructive">{error}</p>}
		</div>
	)
}

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
	const queryClient = useQueryClient()
	const confirm = useConfirmDialog()
	const { data: editorState } = useSuspenseQuery(
		orpc.map.getEditorState.queryOptions(),
	)
	const [scheme, setScheme] = useState(() => cloneScheme(editorState.scheme))
	const initialUniversityFloors = getCampusFloors(
		editorState.scheme,
		"university",
	)
	const [activeCampus, setActiveCampus] = useState<Campus>("university")
	const [activeFloorId, setActiveFloorId] = useState(
		initialUniversityFloors[0]?.id ?? editorState.scheme.floors[0]?.id ?? 0,
	)
	const [activeTool, setActiveTool] = useState<EditorTool>("preview")
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
	const [selectedRoadIndex, setSelectedRoadIndex] = useState<number | null>(
		null,
	)
	const [selectedStairId, setSelectedStairId] = useState<number | null>(null)
	const [selectedObject, setSelectedObject] = useState<SelectedObject>({
		kind: "floor",
	})
	const [roadStart, setRoadStart] = useState<Coordinate | null>(null)
	const [dragTarget, setDragTarget] = useState<DragTarget | null>(null)
	const [past, setPast] = useState<BuildingScheme[]>([])
	const [future, setFuture] = useState<BuildingScheme[]>([])
	const [hasChanges, setHasChanges] = useState(false)
	const [isPublishing, setIsPublishing] = useState(false)
	const [isRestoring, setIsRestoring] = useState(false)
	const [statusMessage, setStatusMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const svgRef = useRef<SVGSVGElement | null>(null)

	useEffect(() => {
		const draft = localStorage.getItem("map-editor-draft")
		if (!draft) return

		try {
			const parsed = buildingSchemeSchema.safeParse(JSON.parse(draft))
			if (!parsed.success) throw new Error("Invalid draft")
			setScheme(parsed.data)
		} catch {
			localStorage.removeItem("map-editor-draft")
		}
	}, [])

	const activeFloor =
		scheme.floors.find((floor) => floor.id === activeFloorId) ??
		scheme.floors[0]
	const campusFloors = useMemo(
		() => getCampusFloors(scheme, activeCampus),
		[activeCampus, scheme],
	)
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
	const isDifferentFromPublished = useMemo(
		() => JSON.stringify(scheme) !== JSON.stringify(editorState.scheme),
		[editorState.scheme, scheme],
	)

	const recordHistory = (snapshot: BuildingScheme) => {
		setPast((items) => [...items.slice(-49), cloneScheme(snapshot)])
		setFuture([])
	}

	const updateScheme = (
		updater: (draft: BuildingScheme) => void,
		options?: { recordHistory?: boolean },
	) => {
		if (options?.recordHistory !== false) recordHistory(scheme)
		const draft = cloneScheme(scheme)
		updater(draft)
		setScheme(draft)
		setHasChanges(true)
	}

	const undo = () => {
		const previous = past.at(-1)
		if (!previous) return
		setPast(past.slice(0, -1))
		setFuture([cloneScheme(scheme), ...future])
		setScheme(cloneScheme(previous))
		setHasChanges(true)
	}

	const redo = () => {
		const next = future[0]
		if (!next) return
		setFuture(future.slice(1))
		setPast([...past, cloneScheme(scheme)])
		setScheme(cloneScheme(next))
		setHasChanges(true)
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null
			if (
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.isContentEditable
			) {
				return
			}
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z")
				return

			event.preventDefault()
			if (event.shiftKey) redo()
			else undo()
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	})

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
			const nextId =
				Math.max(0, ...(activeFloor.stairs ?? []).map((item) => item.id)) + 1
			updateScheme((draft) => {
				const floor = draft.floors.find((item) => item.id === activeFloor.id)
				if (!floor) return
				floor.stairs = [
					...(floor.stairs ?? []),
					{ id: nextId, floors: [floor.id], position: floorPoint },
				]
			})
			setSelectedStairId(nextId)
			setSelectedObject({ kind: "stair", stairId: nextId })
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
			const newRoadIndex = activeFloor.roads?.length ?? 0
			setSelectedRoadIndex(newRoadIndex)
			setSelectedObject({ kind: "road", roadIndex: newRoadIndex })
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
			setSelectedObject({ kind: "room", roomId: selectedRoom.id })
		}
	}

	const movePoint = (event: React.PointerEvent<SVGSVGElement>) => {
		if (!dragTarget || !activeFloor) return
		const worldPoint = toWorldPoint(event.clientX, event.clientY)
		if (!worldPoint) return
		const floorPoint = toFloorPoint(worldPoint)

		updateScheme(
			(draft) => {
				if (dragTarget.kind === "floor") {
					const floor = draft.floors.find((item) => item.id === activeFloor.id)
					if (floor) floor.wallsPosition[dragTarget.pointIndex] = floorPoint
					return
				}

				if (dragTarget.kind === "road") {
					const floor = draft.floors.find((item) => item.id === activeFloor.id)
					const road = floor?.roads?.[dragTarget.roadIndex]
					if (road) road[dragTarget.endpoint] = floorPoint
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
			},
			{ recordHistory: false },
		)
	}

	const addRoom = () => {
		if (!activeFloor) return
		const position = {
			x: Math.round(bounds.x + bounds.width / 2 - activeFloor.position.x),
			y: Math.round(bounds.y + bounds.height / 2 - activeFloor.position.y),
		}
		const nextId =
			Math.max(0, ...scheme.entities.map((entity) => entity.id)) + 1

		updateScheme((draft) => {
			draft.entities.push({
				id: nextId,
				floorId: activeFloor.id,
				type: "room",
				name: "Новая аудитория",
				clickable: true,
				position,
				wallsPosition: [
					{ x: -70, y: -45 },
					{ x: 70, y: -45 },
					{ x: 70, y: 45 },
					{ x: -70, y: 45 },
				],
			})
		})
		setActiveTool("rooms")
		setSelectedRoomId(nextId)
		setSelectedRoadIndex(null)
		setSelectedStairId(null)
		setSelectedObject({ kind: "room", roomId: nextId })
	}

	const deleteSelectedRoom = async () => {
		if (!selectedRoom) return
		const confirmed = await confirm({
			title: `Удалить аудиторию «${selectedRoom.name}»?`,
			confirmLabel: "Удалить",
			destructive: true,
		})
		if (!confirmed) return

		updateScheme((draft) => {
			draft.entities = draft.entities.filter(
				(entity) => entity.id !== selectedRoom.id,
			)
		})
		setSelectedRoomId(null)
		setSelectedObject({ kind: "floor" })
	}

	const deleteSelectedRoad = () => {
		if (selectedRoadIndex === null || !activeFloor) return
		updateScheme((draft) => {
			const floor = draft.floors.find((item) => item.id === activeFloor.id)
			floor?.roads?.splice(selectedRoadIndex, 1)
		})
		setSelectedRoadIndex(null)
		setSelectedObject({ kind: "floor" })
	}

	const getSelectedJsonValue = () => {
		if (!activeFloor) return null
		if (selectedObject.kind === "floor") return activeFloor
		if (selectedObject.kind === "room")
			return scheme.entities.find(
				(entity) => isRoom(entity) && entity.id === selectedObject.roomId,
			)
		if (selectedObject.kind === "road")
			return activeFloor.roads?.[selectedObject.roadIndex]
		return activeFloor.stairs?.find(
			(stair) => stair.id === selectedObject.stairId,
		)
	}

	const applySelectedJson = (value: unknown) => {
		if (!activeFloor || typeof value !== "object" || value === null) return
		const next = cloneScheme(scheme)
		const floorIndex = next.floors.findIndex(
			(floor) => floor.id === activeFloor.id,
		)
		if (floorIndex < 0) return

		if (selectedObject.kind === "floor")
			next.floors[floorIndex] = value as Floor
		if (selectedObject.kind === "room") {
			const entityIndex = next.entities.findIndex(
				(entity) => entity.id === selectedObject.roomId,
			)
			if (entityIndex >= 0) next.entities[entityIndex] = value as Room
		}
		if (selectedObject.kind === "road") {
			const roads = next.floors[floorIndex].roads
			if (roads?.[selectedObject.roadIndex])
				roads[selectedObject.roadIndex] = value as Road
		}
		if (selectedObject.kind === "stair") {
			const stairs = next.floors[floorIndex].stairs
			const stairIndex = stairs?.findIndex(
				(stair) => stair.id === selectedObject.stairId,
			)
			if (stairs && stairIndex !== undefined && stairIndex >= 0)
				stairs[stairIndex] = value as Stair
		}

		const parsed = buildingSchemeSchema.safeParse(next)
		if (!parsed.success) throw new Error("Invalid object")

		recordHistory(scheme)
		setScheme(parsed.data)
		setHasChanges(true)
		if (selectedObject.kind === "floor") setActiveFloorId((value as Floor).id)
		if (selectedObject.kind === "room") {
			setSelectedRoomId((value as Room).id)
			setSelectedObject({ kind: "room", roomId: (value as Room).id })
		}
		if (selectedObject.kind === "stair") {
			setSelectedStairId((value as Stair).id)
			setSelectedObject({ kind: "stair", stairId: (value as Stair).id })
		}
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
		setScheme(cloneScheme(editorState.scheme))
		setSelectedRoomId(null)
		setSelectedRoadIndex(null)
		setSelectedStairId(null)
		setSelectedObject({ kind: "floor" })
		setRoadStart(null)
		setHasChanges(false)
		setPast([])
		setFuture([])
		localStorage.removeItem("map-editor-draft")
	}

	const invalidateMapQueries = async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: orpc.map.getMap.queryKey(),
			}),
			queryClient.invalidateQueries({
				queryKey: orpc.map.getEditorState.queryKey(),
			}),
		])
	}

	const publishMap = async () => {
		const confirmed = await confirm({
			title: "Опубликовать карту?",
			description:
				"Текущая рабочая карта будет сохранена как резервная копия, затем заменена этим черновиком.",
			confirmLabel: "Опубликовать",
		})
		if (!confirmed) return

		setIsPublishing(true)
		setError(null)
		setStatusMessage(null)
		try {
			await orpc.map.publishMap.call(scheme)
			localStorage.removeItem("map-editor-draft")
			setHasChanges(false)
			setPast([])
			setFuture([])
			setStatusMessage("Карта опубликована. Предыдущая версия сохранена.")
			await invalidateMapQueries()
		} catch {
			setError("Не удалось опубликовать карту. Проверьте корректность плана.")
		} finally {
			setIsPublishing(false)
		}
	}

	const restoreMap = async () => {
		const confirmed = await confirm({
			title: "Восстановить резервную карту?",
			description:
				"Рабочая карта и резервная копия поменяются местами. Действие можно отменить повторным восстановлением.",
			confirmLabel: "Восстановить",
			destructive: true,
		})
		if (!confirmed) return

		setIsRestoring(true)
		setError(null)
		setStatusMessage(null)
		try {
			const result = await orpc.map.restoreMap.call()
			setScheme(cloneScheme(result.scheme))
			setActiveFloorId(result.scheme.floors[0]?.id ?? 0)
			setSelectedRoomId(null)
			setSelectedRoadIndex(null)
			setSelectedStairId(null)
			setSelectedObject({ kind: "floor" })
			setRoadStart(null)
			setHasChanges(false)
			setPast([])
			setFuture([])
			localStorage.removeItem("map-editor-draft")
			setStatusMessage("Резервная карта восстановлена.")
			await invalidateMapQueries()
		} catch {
			setError("Не удалось восстановить резервную карту.")
		} finally {
			setIsRestoring(false)
		}
	}

	if (!activeFloor) return null
	const selectedJsonValue = getSelectedJsonValue()
	const selectedJsonLabel =
		selectedObject.kind === "floor"
			? "этаж"
			: selectedObject.kind === "room"
				? "аудитория"
				: selectedObject.kind === "road"
					? "дорога"
					: "лестница"

	return (
		<div className="min-h-screen p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<PageTitle title="Редактирование карты" />
						<p className="-mt-3 text-sm text-muted">
							Рабочая карта изменится только после публикации
						</p>
					</div>
					<div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
						<Button
							variant="secondary"
							label={
								hasChanges
									? "Сохранить черновик"
									: isDifferentFromPublished
										? "Черновик сохранён"
										: "Нет изменений"
							}
							leftIcon="iconify:material-symbols:check-circle"
							disabled={!hasChanges || isPublishing}
							onClick={saveDraft}
						/>
						<Button
							label={isPublishing ? "Публикация..." : "Опубликовать"}
							leftIcon="iconify:material-symbols:upload-file"
							disabled={
								!isDifferentFromPublished || isPublishing || isRestoring
							}
							onClick={publishMap}
						/>
					</div>
				</div>

				<div className="relative flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-4">
					<LiquidBorder />
					<div>
						<p className="font-medium">Резервная копия</p>
						<p className="text-sm text-muted">
							{editorState.backup
								? `Создана ${new Date(editorState.backup.createdAt).toLocaleString("ru-RU")}`
								: "Будет создана при первой публикации"}
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						label={isRestoring ? "Восстановление..." : "Восстановить"}
						disabled={!editorState.backup || isPublishing || isRestoring}
						onClick={restoreMap}
					/>
				</div>

				{statusMessage && (
					<p className="rounded-2xl bg-card px-4 py-3 text-sm">
						{statusMessage}
					</p>
				)}
				{error && (
					<p className="rounded-2xl bg-card px-4 py-3 text-sm text-destructive">
						{error}
					</p>
				)}

				<div className="flex flex-wrap gap-2">
					<ToolButton
						active={activeCampus === "university"}
						label="Вуз"
						onClick={() => {
							setActiveCampus("university")
							const floor = getCampusFloors(scheme, "university")[0]
							if (floor) setActiveFloorId(floor.id)
							setSelectedRoomId(null)
							setSelectedRoadIndex(null)
							setSelectedStairId(null)
							setSelectedObject({ kind: "floor" })
						}}
					/>
					<ToolButton
						active={activeCampus === "school"}
						label="Школа"
						onClick={() => {
							setActiveCampus("school")
							const floor = getCampusFloors(scheme, "school")[0]
							if (floor) setActiveFloorId(floor.id)
							setSelectedRoomId(null)
							setSelectedRoadIndex(null)
							setSelectedStairId(null)
							setSelectedObject({ kind: "floor" })
						}}
					/>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-1">
					{campusFloors.map((floor) => (
						<ToolButton
							key={floor.id}
							active={floor.id === activeFloor.id}
							label={`${getFloorNumber(floor)} этаж`}
							onClick={() => {
								setActiveFloorId(floor.id)
								setSelectedRoomId(null)
								setSelectedRoadIndex(null)
								setSelectedStairId(null)
								setSelectedObject({ kind: "floor" })
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
										if (tool.id === "floor")
											setSelectedObject({ kind: "floor" })
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
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="secondary"
									size="sm"
									label="Отменить"
									leftIcon="arrow-uturn-left-outline-24"
									disabled={past.length === 0}
									onClick={undo}
								/>
								<Button
									variant="secondary"
									size="sm"
									label="Повторить"
									leftIcon="arrow-uturn-right-outline-24"
									disabled={future.length === 0}
									onClick={redo}
								/>
							</div>
							{activeTool === "rooms" && (
								<>
									<Button
										size="sm"
										label="Добавить аудиторию"
										leftIcon="iconify:material-symbols:add"
										onClick={addRoom}
									/>
									<Button
										variant="secondary"
										size="sm"
										label="Удалить аудиторию"
										leftIcon="iconify:material-symbols:delete-outline"
										disabled={!selectedRoom}
										onClick={deleteSelectedRoom}
										className="text-destructive"
									/>
								</>
							)}
							{activeTool === "roads" && (
								<Button
									variant="secondary"
									size="sm"
									label="Удалить дорогу"
									leftIcon="iconify:material-symbols:delete-outline"
									disabled={selectedRoadIndex === null}
									onClick={deleteSelectedRoad}
									className="text-destructive"
								/>
							)}
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

								{activeFloor.roads?.map((road: Road, index) => {
									const selected = selectedRoadIndex === index
									return (
										<g key={`${road.start.x}-${road.start.y}-${index}`}>
											<line
												x1={road.start.x + activeFloor.position.x}
												y1={road.start.y + activeFloor.position.y}
												x2={road.end.x + activeFloor.position.x}
												y2={road.end.y + activeFloor.position.y}
												stroke={selected ? "var(--accent)" : "var(--map-route)"}
												strokeWidth={
													selected ? 8 : activeTool === "roads" ? 5 : 3
												}
												strokeDasharray={
													activeTool === "preview" ? undefined : "10 8"
												}
												strokeLinecap="round"
												opacity={activeTool === "preview" ? 0.45 : 0.9}
												role="button"
												tabIndex={activeTool === "roads" ? 0 : undefined}
												className={
													activeTool === "roads" ? "cursor-pointer" : undefined
												}
												onClick={(event) => {
													if (activeTool !== "roads") return
													event.stopPropagation()
													setSelectedRoadIndex(index)
													setSelectedRoomId(null)
													setSelectedStairId(null)
													setSelectedObject({ kind: "road", roadIndex: index })
												}}
												onKeyDown={(event) => {
													if (
														activeTool === "roads" &&
														(event.key === "Enter" || event.key === " ")
													) {
														event.preventDefault()
														setSelectedRoadIndex(index)
														setSelectedObject({
															kind: "road",
															roadIndex: index,
														})
													}
												}}
											/>
											{activeTool === "roads" &&
												selected &&
												(["start", "end"] as const).map((endpoint) => (
													<circle
														key={endpoint}
														cx={road[endpoint].x + activeFloor.position.x}
														cy={road[endpoint].y + activeFloor.position.y}
														r="11"
														fill="var(--accent)"
														stroke="var(--map-background)"
														strokeWidth="4"
														className="cursor-grab"
														onPointerDown={(event) => {
															event.stopPropagation()
															recordHistory(scheme)
															setDragTarget({
																kind: "road",
																roadIndex: index,
																endpoint,
															})
														}}
													/>
												))}
										</g>
									)
								})}

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
														setSelectedRoadIndex(null)
														setSelectedStairId(null)
														setSelectedObject({ kind: "room", roomId: room.id })
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
														setSelectedObject({ kind: "room", roomId: room.id })
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
															recordHistory(scheme)
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
										role="button"
										tabIndex={activeTool === "stairs" ? 0 : undefined}
										className={
											activeTool === "stairs" ? "cursor-pointer" : undefined
										}
										onClick={(event) => {
											if (activeTool !== "stairs") return
											event.stopPropagation()
											setSelectedStairId(stair.id)
											setSelectedRoomId(null)
											setSelectedRoadIndex(null)
											setSelectedObject({ kind: "stair", stairId: stair.id })
										}}
										onKeyDown={(event) => {
											if (
												activeTool === "stairs" &&
												(event.key === "Enter" || event.key === " ")
											) {
												event.preventDefault()
												setSelectedStairId(stair.id)
												setSelectedObject({
													kind: "stair",
													stairId: stair.id,
												})
											}
										}}
									>
										<circle
											r={
												selectedStairId === stair.id
													? 21
													: activeTool === "stairs"
														? 18
														: 14
											}
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
												recordHistory(scheme)
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

				{selectedJsonValue && (
					<JsonEditor
						label={selectedJsonLabel}
						value={selectedJsonValue}
						onApply={applySelectedJson}
					/>
				)}
			</div>
		</div>
	)
}
