"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import * as fabric from "fabric"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { isRoom } from "@repo/shared/building-scheme"

import { analytics } from "@/shared/lib/analytics"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useColorScheme } from "../hooks/use-color-scheme"
import { useFloorRender } from "../hooks/use-floor-render"
import { useFloorTransition } from "../hooks/use-floor-transition"
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapData } from "../hooks/use-map-data"
import { useMapInteractions } from "../hooks/use-map-interactions"
import { useMapViewport } from "../hooks/use-map-viewport"
import { usePersistedMapView } from "../hooks/use-persisted-map-view"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { useSelectedRoom } from "../hooks/use-selected-room"
import { levelFloors } from "../lib/campus-layout"
import {
	clamp,
	collectBounds,
	createViewportMatrix,
	getRoomWorldCenter,
} from "../lib/geometry"
import { restoreMapView } from "../lib/persisted-map-view"
import type { ViewportState } from "../types"
import { CursorPositionDebug } from "./cursor-position-debug"
import { MapControls } from "./map-controls"
import { RoomModal } from "./room-modal"
import { RouteBuilderModal } from "./route-builder-modal"

import "./floor-transition.css"

type MapViewerProps = {
	initialRoomId?: number
	active?: boolean
}

const collectLevelBounds = (
	data: import("@repo/shared/building-scheme").BuildingScheme,
	floorId: number,
) => {
	const bounds = levelFloors(data, floorId).map((floor) =>
		collectBounds(floor, data.entities),
	)
	return {
		minX: Math.min(...bounds.map((b) => b.minX)),
		minY: Math.min(...bounds.map((b) => b.minY)),
		maxX: Math.max(...bounds.map((b) => b.maxX)),
		maxY: Math.max(...bounds.map((b) => b.maxY)),
	}
}

const FLOOR_PADDING = 192
const MAX_FLOOR_FIT_ZOOM = 1
const MAX_ROOM_ZOOM = 0.5

export const MapViewer = ({ initialRoomId, active = true }: MapViewerProps) => {
	const mapData = useMapData()
	const colorScheme = useColorScheme()

	const { start, end, endNearestToilet, isActive } = useRouteBuilder()

	const { data: routeData } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input:
				start && (end || endNearestToilet)
					? { start, end, nearestToilet: endNearestToilet }
					: skipToken,
		}),
	)

	const { activeFloor, setActiveFloor } = useActiveFloor()
	const { selectedRoomId, setSelectedRoomId } = useSelectedRoom()
	const initialRoom = useMemo(
		() =>
			initialRoomId === undefined
				? undefined
				: mapData?.entities.find(
						(entity) => entity.id === initialRoomId && isRoom(entity),
					),
		[initialRoomId, mapData],
	)
	const [isDebug] = useState(import.meta.env.DEV)

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const fabricRef = useRef<fabric.Canvas | null>(null)

	const textObjectsRef = useRef<fabric.Text[]>([])
	const labelBaseSizeRef = useRef(new WeakMap<fabric.FabricText, number>())
	const iconObjectsRef = useRef<fabric.Object[]>([])
	const iconBaseScaleRef = useRef(new WeakMap<fabric.Object, number>())
	const [rotation, setRotation] = useState(0)
	const [isCanvasReady, setIsCanvasReady] = useState(false)
	const [isViewportReady, setIsViewportReady] = useState(false)
	const savedView = usePersistedMapView(isViewportReady)
	const { transitionRef, liveLayerRef, snapshotRef, onFloorReady } =
		useFloorTransition({
			activeFloor,
			floors: mapData.floors,
			canvasRef,
			enabled: isViewportReady,
		})
	const [cursorCoords, setCursorCoords] = useState<{
		screen: { x: number; y: number }
		world: { x: number; y: number }
	} | null>(null)

	const handleViewportChange = useCallback((next: ViewportState) => {
		setRotation(next.rotation)
	}, [])

	const bounds = useMemo(() => {
		if (!mapData) return null
		const floor = mapData.floors.find((f) => f.id === activeFloor)
		if (!floor) return null
		return collectLevelBounds(mapData, floor.id)
	}, [mapData, activeFloor])

	const {
		viewportRef,
		applyViewport,
		screenToWorld,
		zoomAtPoint,
		rotateAtCenter,
	} = useMapViewport({
		fabricRef,
		textObjectsRef,
		labelBaseSizeRef,
		iconObjectsRef,
		iconBaseScaleRef,
		onViewportChange: handleViewportChange,
		bounds,
	})

	useEffect(() => {
		if (isViewportReady) applyViewport({ ...viewportRef.current })
	}, [applyViewport, isViewportReady, viewportRef])

	const handleResize = useCallback(
		(
			width: number,
			height: number,
			prevWidth: number | undefined,
			prevHeight: number | undefined,
		) => {
			if (!prevWidth || !prevHeight) return

			const state = viewportRef.current
			const prevCenter = new fabric.Point(prevWidth / 2, prevHeight / 2)
			const worldCenter = screenToWorld(prevCenter, state)
			const matrix = createViewportMatrix({
				...state,
				translateX: 0,
				translateY: 0,
			})
			const screenWithZero = fabric.util.transformPoint(worldCenter, matrix)

			applyViewport({
				...state,
				translateX: width / 2 - screenWithZero.x,
				translateY: height / 2 - screenWithZero.y,
			})
		},
		[applyViewport, screenToWorld, viewportRef],
	)

	useMapCanvas({
		canvasRef,
		fabricRef,
		onResize: handleResize,
		onInit: () => setIsCanvasReady(true),
	})

	const getFloorViewport = useCallback(
		(floorId: number) => {
			const canvas = fabricRef.current
			if (!canvas || !mapData) return null

			const floor = mapData.floors.find((f) => f.id === floorId)
			if (!floor) return null

			const bounds = collectLevelBounds(mapData, floor.id)
			const worldWidth = bounds.maxX - bounds.minX + FLOOR_PADDING * 2
			const worldHeight = bounds.maxY - bounds.minY + FLOOR_PADDING * 2

			const zoomFit = Math.min(
				canvas.getWidth() / worldWidth,
				canvas.getHeight() / worldHeight,
			)
			const zoom = clamp(zoomFit, 0.05, MAX_FLOOR_FIT_ZOOM)

			const center = {
				x: (bounds.maxX + bounds.minX) / 2,
				y: (bounds.maxY + bounds.minY) / 2,
			}

			return {
				zoom,
				rotation: 0,
				translateX: canvas.getWidth() / 2 - center.x * zoom,
				translateY: canvas.getHeight() / 2 - center.y * zoom,
			}
		},
		[mapData],
	)

	const centerOnFloor = useCallback(
		(floorId: number) => {
			const viewport = getFloorViewport(floorId)
			if (viewport) applyViewport(viewport)
		},
		[applyViewport, getFloorViewport],
	)

	const centerOnRoom = useCallback(
		(roomId: number) => {
			const canvas = fabricRef.current
			const room = mapData?.entities.find(
				(entity) => entity.id === roomId && isRoom(entity),
			)
			const floor = mapData?.floors.find((floor) => floor.id === room?.floorId)
			if (!canvas || !room || !isRoom(room) || !floor) return

			const center = getRoomWorldCenter(room, floor)
			const floorViewport = getFloorViewport(room.floorId)
			const zoom = floorViewport
				? Math.max(
						floorViewport.zoom,
						Math.min(floorViewport.zoom * 1.75, MAX_ROOM_ZOOM),
					)
				: MAX_ROOM_ZOOM

			applyViewport({
				zoom,
				rotation: 0,
				translateX: canvas.getWidth() / 2 - center.x * zoom,
				translateY: canvas.getHeight() / 2 - center.y * zoom,
			})
		},
		[applyViewport, getFloorViewport, mapData],
	)

	const centeredRoomIdRef = useRef<number | null>(null)
	const hasCenteredDefaultRef = useRef(false)
	useEffect(() => {
		if (!active) {
			centeredRoomIdRef.current = null
			return
		}
		if (!isCanvasReady || !mapData) return

		if (initialRoom && isRoom(initialRoom)) {
			if (centeredRoomIdRef.current === initialRoom.id) return

			if (activeFloor !== initialRoom.floorId) {
				setActiveFloor(initialRoom.floorId)
				return
			}

			centerOnRoom(initialRoom.id)
			setSelectedRoomId(initialRoom.id)
			analytics.track("room_clicked", {
				room_id: initialRoom.id,
				room_name: initialRoom.name,
				floor_id: initialRoom.floorId,
				source: "schedule",
			})
			centeredRoomIdRef.current = initialRoom.id
			hasCenteredDefaultRef.current = true
			setIsViewportReady(true)
			return
		}

		if (centeredRoomIdRef.current !== null) {
			centeredRoomIdRef.current = null
			setSelectedRoomId(null)
		}
		if (hasCenteredDefaultRef.current) return
		if (savedView === undefined) return

		const savedFloor = savedView
			? mapData.floors.find((floor) => floor.id === savedView.floorId)
			: undefined
		if (savedView && savedFloor) {
			if (activeFloor !== savedFloor.id) {
				setActiveFloor(savedFloor.id)
				return
			}

			const canvas = fabricRef.current
			if (!canvas) return
			applyViewport(
				restoreMapView(savedView, canvas.getWidth(), canvas.getHeight()),
			)
		} else {
			const defaultFloor =
				mapData.floors.find((floor) => floor.id === activeFloor) ??
				mapData.floors[0]
			if (!defaultFloor) return
			if (activeFloor !== defaultFloor.id) {
				setActiveFloor(defaultFloor.id)
				return
			}
			centerOnFloor(defaultFloor.id)
		}
		setSelectedRoomId(null)
		centeredRoomIdRef.current = null
		hasCenteredDefaultRef.current = true
		setIsViewportReady(true)
	}, [
		active,
		activeFloor,
		applyViewport,
		centerOnFloor,
		centerOnRoom,
		initialRoom,
		isCanvasReady,
		mapData,
		savedView,
		setActiveFloor,
		setSelectedRoomId,
	])

	const resetRotation = useCallback(() => {
		const currentRotation = viewportRef.current.rotation
		if (Math.abs(currentRotation) < 0.001) return

		rotateAtCenter(-currentRotation)
	}, [rotateAtCenter, viewportRef])

	const handleRoomClick = useCallback(
		(roomId: number) => {
			const room = mapData?.entities.find(
				(entity) => entity.id === roomId && isRoom(entity),
			)

			if (room && isRoom(room)) {
				analytics.track("room_clicked", {
					room_id: room.id,
					room_name: room.name,
					floor_id: room.floorId,
					source: "map",
				})
			}

			setSelectedRoomId(roomId)
		},
		[mapData, setSelectedRoomId],
	)

	useMapInteractions({
		enabled: active,
		fabricRef,
		zoomAtPoint,
		rotateAtCenter,
		applyViewport,
		viewportRef,
		screenToWorld,
		onRoomClick: handleRoomClick,
		onPointerMove: isDebug ? setCursorCoords : undefined,
	})

	useFloorRender({
		fabricRef,
		data: mapData,
		activeFloor,
		selectedRoomId,
		applyViewport,
		viewportRef,
		textObjectsRef,
		labelBaseSizeRef,
		iconObjectsRef,
		iconBaseScaleRef,
		isDebug,
		route: isActive ? routeData?.route : undefined,
		enabled: isCanvasReady,
		colorScheme,
		onFloorReady,
	})

	return (
		<div className="relative h-full w-full overflow-hidden bg-(--map-background)">
			<div
				ref={transitionRef}
				className="map-floor-transition t-page-slide"
				data-page="1"
			>
				<div ref={liveLayerRef} className="t-page" data-page-id="1">
					<canvas ref={canvasRef} className="size-full" />
				</div>
				<canvas
					ref={snapshotRef}
					className="t-page"
					data-page-id="2"
					aria-hidden="true"
					tabIndex={-1}
					inert
				/>
			</div>

			{isDebug && cursorCoords && (
				<CursorPositionDebug cursorCoords={cursorCoords} />
			)}

			{active && (
				<>
					<MapControls
						hidden={selectedRoomId != null}
						activeFloor={activeFloor}
						onChangeFloor={(floorId) => {
							setActiveFloor(floorId)
						}}
						rotation={rotation}
						resetRotation={resetRotation}
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
