"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import * as fabric from "fabric"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useColorScheme } from "../hooks/use-color-scheme"
import { useFloorRender } from "../hooks/use-floor-render"
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapData } from "../hooks/use-map-data"
import { useMapInteractions } from "../hooks/use-map-interactions"
import { useMapViewport } from "../hooks/use-map-viewport"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { useSelectedRoom } from "../hooks/use-selected-room"
import { clamp, collectBounds, createViewportMatrix } from "../lib/geometry"
import type { ViewportState } from "../types"
import { CursorPositionDebug } from "./cursor-position-debug"
import { MapControls } from "./map-controls"
import { RoomModal } from "./room-modal"
import { RouteBuilderModal } from "./route-builder-modal"

export const MapViewer = () => {
	const mapData = useMapData()
	const colorScheme = useColorScheme()

	const { start, end, isActive } = useRouteBuilder()

	const { data: routeData } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input: start && end ? { start, end } : skipToken,
		}),
	)

	const { activeFloor, setActiveFloor } = useActiveFloor()
	const { selectedRoomId, setSelectedRoomId } = useSelectedRoom()
	const [isDebug] = useState(process.env.NODE_ENV === "development")

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const fabricRef = useRef<fabric.Canvas | null>(null)

	const textObjectsRef = useRef<fabric.Text[]>([])
	const labelBaseSizeRef = useRef(new WeakMap<fabric.FabricText, number>())
	const iconObjectsRef = useRef<fabric.Object[]>([])
	const iconBaseScaleRef = useRef(new WeakMap<fabric.Object, number>())
	const [rotation, setRotation] = useState(0)
	const [isCanvasReady, setIsCanvasReady] = useState(false)
	const [isFloorVisible, setIsFloorVisible] = useState(false)
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

	const centerOnFloor = useCallback(
		(floorId: number) => {
			const canvas = fabricRef.current
			if (!canvas || !mapData) return

			const floor = mapData.floors.find((f) => f.id === floorId)
			if (!floor) return

			const bounds = collectBounds(floor, mapData.entities)
			const padding = 192
			const worldWidth = bounds.maxX - bounds.minX + padding * 2
			const worldHeight = bounds.maxY - bounds.minY + padding * 2

			const zoomFit = Math.min(
				canvas.getWidth() / worldWidth,
				canvas.getHeight() / worldHeight,
			)

			const center = {
				x: (bounds.maxX + bounds.minX) / 2,
				y: (bounds.maxY + bounds.minY) / 2,
			}

			applyViewport({
				zoom: clamp(zoomFit, 0.05, 8),
				rotation: 0,
				translateX: canvas.getWidth() / 2 - center.x * zoomFit,
				translateY: canvas.getHeight() / 2 - center.y * zoomFit,
			})
		},
		[applyViewport, mapData],
	)

	const hasCenteredRef = useRef(false)
	useEffect(() => {
		if (isCanvasReady && mapData && !hasCenteredRef.current) {
			centerOnFloor(activeFloor)
			hasCenteredRef.current = true
		}
	}, [isCanvasReady, mapData, activeFloor, centerOnFloor])

	// Fade in the floor after it's rendered
	useEffect(() => {
		if (isCanvasReady && mapData) {
			// Small delay to allow the floor to render before fading in
			const timer = requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsFloorVisible(true)
				})
			})
			return () => cancelAnimationFrame(timer)
		}
		setIsFloorVisible(false)
	}, [isCanvasReady, mapData])

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

	useMapInteractions({
		fabricRef,
		zoomAtPoint,
		rotateAtCenter,
		applyViewport,
		viewportRef,
		screenToWorld,
		onRoomClick: (roomId) => setSelectedRoomId(roomId),
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
			<canvas
				ref={canvasRef}
				className="size-full transition-opacity duration-300"
				style={{ opacity: isFloorVisible ? 1 : 0 }}
			/>

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
