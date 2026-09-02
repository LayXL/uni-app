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
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapData } from "../hooks/use-map-data"
import { useMapInteractions } from "../hooks/use-map-interactions"
import { useMapViewport } from "../hooks/use-map-viewport"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { useSelectedRoom } from "../hooks/use-selected-room"
import {
	clamp,
	collectBounds,
	createViewportMatrix,
	getRoomWorldCenter,
} from "../lib/geometry"
import type { ViewportState } from "../types"
import { CursorPositionDebug } from "./cursor-position-debug"
import { MapControls } from "./map-controls"
import { RoomModal } from "./room-modal"
import { RouteBuilderModal } from "./route-builder-modal"

type MapViewerProps = {
	initialRoomId?: number
}

const FLOOR_PADDING = 192
const MAX_FLOOR_FIT_ZOOM = 1
const MAX_ROOM_ZOOM = 0.5

export const MapViewer = ({ initialRoomId }: MapViewerProps) => {
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
	const [isDebug] = useState(process.env.NODE_ENV === "development")

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const fabricRef = useRef<fabric.Canvas | null>(null)

	const textObjectsRef = useRef<fabric.Text[]>([])
	const labelBaseSizeRef = useRef(new WeakMap<fabric.FabricText, number>())
	const iconObjectsRef = useRef<fabric.Object[]>([])
	const iconBaseScaleRef = useRef(new WeakMap<fabric.Object, number>())
	const [rotation, setRotation] = useState(0)
	const [isCanvasReady, setIsCanvasReady] = useState(false)
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
		return collectBounds(floor, mapData.entities)
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

			const bounds = collectBounds(floor, mapData.entities)
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
			hasCenteredDefaultRef.current = false
			return
		}

		if (hasCenteredDefaultRef.current) return

		centerOnFloor(activeFloor)
		setSelectedRoomId(null)
		centeredRoomIdRef.current = null
		hasCenteredDefaultRef.current = true
	}, [
		activeFloor,
		centerOnFloor,
		centerOnRoom,
		initialRoom,
		isCanvasReady,
		mapData,
		setActiveFloor,
		setSelectedRoomId,
	])

	const zoomByStep = useCallback(
		(deltaZoom: number) => {
			const canvas = fabricRef.current
			if (!canvas) return

			const center = new fabric.Point(
				canvas.getWidth() / 2,
				canvas.getHeight() / 2,
			)
			zoomAtPoint(center, deltaZoom)
		},
		[zoomAtPoint],
	)

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
	})

	return (
		<div className="relative h-full w-full overflow-hidden bg-(--map-background)">
			<canvas ref={canvasRef} className="size-full" />

			{isDebug && cursorCoords && (
				<CursorPositionDebug cursorCoords={cursorCoords} />
			)}

			<MapControls
				activeFloor={activeFloor}
				onChangeFloor={(floorId) => {
					setActiveFloor(floorId)
					centerOnFloor(floorId)
				}}
				zoomByStep={zoomByStep}
				rotation={rotation}
				resetRotation={resetRotation}
			/>

			<RoomModal
				roomId={selectedRoomId}
				onClose={() => setSelectedRoomId(null)}
			/>
			<RouteBuilderModal />
		</div>
	)
}
