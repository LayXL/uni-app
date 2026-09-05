import { skipToken, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { isRoom } from "@repo/shared/building-scheme"

import { analytics } from "@/shared/lib/analytics"
import { haptic } from "@/shared/utils/haptic"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useColorScheme } from "../hooks/use-color-scheme"
import { useMapData } from "../hooks/use-map-data"
import { useMapState } from "../hooks/use-map-state"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { useSelectedRoom } from "../hooks/use-selected-room"
import type {
	IndoorCameraView,
	IndoorScene,
	IndoorView,
} from "../lib/indoor-scene"
import { readIndoorView, saveIndoorView } from "../lib/indoor-view-storage"
import { IndoorMapCanvas } from "./indoor-map-canvas"
import { MapControls } from "./map-controls"
import { RoomModal } from "./room-modal"
import { RouteBuilderModal } from "./route-builder-modal"

export const IndoorMapViewer = ({
	initialRoomId,
	active = true,
	onUnavailable,
}: {
	initialRoomId?: number
	active?: boolean
	onUnavailable: () => void
}) => {
	const data = useMapData()
	const theme = useColorScheme()
	const { activeFloor, setActiveFloor } = useActiveFloor()
	const { selectedRoomId, setSelectedRoomId } = useSelectedRoom()
	const { start, end, endNearestToilet, isActive } = useRouteBuilder()
	const [savedView] = useState(() =>
		initialRoomId == null ? readIndoorView() : null,
	)
	const [view, setView] = useState<IndoorView>(savedView?.view ?? "3d")
	const sceneRef = useRef<IndoorScene | null>(null)
	const initialized = useRef(false)
	const initialId = useRef<number | undefined>(undefined)
	const cameraRef = useRef<IndoorCameraView | null>(null)
	const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	const floorRef = useRef(activeFloor)
	const { data: routeData } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input:
				isActive && start && (end || endNearestToilet)
					? { start, end, nearestToilet: endNearestToilet }
					: skipToken,
		}),
	)

	useEffect(() => {
		floorRef.current = activeFloor
	}, [activeFloor])
	useEffect(() => {
		if (!active) {
			initialId.current = undefined
			return
		}
		if (initialRoomId == null) initialId.current = undefined
		const initial = data.entities.find(
			(e) => e.id === initialRoomId && isRoom(e),
		)
		if (initial && initialId.current !== initial.id) {
			setActiveFloor(initial.floorId)
			setSelectedRoomId(initial.id)
			if (selectedRoomId === initial.id && activeFloor === initial.floorId) {
				sceneRef.current?.select(initial.id)
			}
			initialId.current = initial.id
			initialized.current = true
			analytics.track("room_clicked", {
				room_id: initial.id,
				room_name: initial.name,
				floor_id: initial.floorId,
				source: "schedule",
			})
		} else if (!initialized.current) {
			const floor =
				data.floors.find((f) => f.id === savedView?.floorId) ??
				data.floors.find((f) => f.id === activeFloor) ??
				data.floors[0]
			if (floor) setActiveFloor(floor.id)
			setSelectedRoomId(null)
			initialized.current = true
		}
	}, [
		data,
		active,
		initialRoomId,
		selectedRoomId,
		activeFloor,
		savedView,
		setActiveFloor,
		setSelectedRoomId,
	])

	// Existing search and route steps send explicit world-coordinate camera requests.
	useEffect(() => {
		if (!active) return
		let frame = 0
		const unsubscribe = useMapState.subscribe((state, previous) => {
			const target = state.focusRequest
			if (target && target !== previous.focusRequest) {
				cancelAnimationFrame(frame)
				frame = requestAnimationFrame(() => sceneRef.current?.focus(target))
			}
		})
		return () => {
			unsubscribe()
			cancelAnimationFrame(frame)
		}
	}, [active])
	useEffect(() => {
		const save = () => {
			clearTimeout(saveTimer.current)
			if (cameraRef.current)
				saveIndoorView({ ...cameraRef.current, floorId: floorRef.current })
		}
		const onVisibility = () => {
			if (document.visibilityState === "hidden") save()
		}
		window.addEventListener("pagehide", save)
		document.addEventListener("visibilitychange", onVisibility)
		return () => {
			save()
			window.removeEventListener("pagehide", save)
			document.removeEventListener("visibilitychange", onVisibility)
		}
	}, [])
	const onCamera = useCallback((camera: IndoorCameraView) => {
		cameraRef.current = camera
		clearTimeout(saveTimer.current)
		saveTimer.current = setTimeout(
			() => saveIndoorView({ ...camera, floorId: floorRef.current }),
			400,
		)
	}, [])
	const select = (id: number) => {
		const entity = data.entities.find((e) => e.id === id)
		if (!entity) return
		haptic("selection")
		setSelectedRoomId(id)
		if (isRoom(entity))
			analytics.track("room_clicked", {
				room_id: entity.id,
				room_name: entity.name,
				floor_id: entity.floorId,
				source: "map",
			})
	}
	const changeFloor = (id: number) => {
		setSelectedRoomId(null)
		setActiveFloor(id)
	}

	return (
		<div className="relative size-full overflow-hidden bg-(--map-background)">
			<IndoorMapCanvas
				active={active}
				data={data}
				activeFloor={activeFloor}
				selectedRoomId={selectedRoomId}
				theme={theme}
				view={view}
				route={isActive ? routeData?.route : undefined}
				sceneRef={sceneRef}
				savedView={savedView}
				onSelect={select}
				onFloor={changeFloor}
				onError={onUnavailable}
				onCamera={onCamera}
			/>
			{active && (
				<>
					<MapControls
						activeFloor={activeFloor}
						onChangeFloor={changeFloor}
						zoomByStep={(factor) => sceneRef.current?.zoom(factor)}
						view={view}
						onToggleView={() => setView(view === "3d" ? "top" : "3d")}
					/>
					<RoomModal
						roomId={selectedRoomId}
						onClose={() => setSelectedRoomId(null)}
					/>
					<RouteBuilderModal />
				</>
			)}
		</div>
	)
}
