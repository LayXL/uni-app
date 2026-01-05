"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import * as fabric from "fabric"
import { motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { Icon } from "@/shared/ui/icon"
import { ModalRoot } from "@/shared/ui/modal-root"
import { cn } from "@/shared/utils/cn"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useFilteredFloors } from "../hooks/use-filtered-floors"
import { useFloorRender } from "../hooks/use-floor-render"
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapInteractions } from "../hooks/use-map-interactions"
import { useMapViewport } from "../hooks/use-map-viewport"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { clamp, collectBounds, createViewportMatrix } from "../lib/geometry"
import type { ViewportState } from "../types"
import { RoomModal } from "./room-modal"

export const MapViewer = () => {
	const { data: mapData } = useQuery(orpc.map.getMap.queryOptions())

	const { start, end, setStart, setEnd } = useRouteBuilder()

	const { data: routeData } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input: start && end ? { start, end } : skipToken,
		}),
	)

	const [activeCampus, setActiveCampus] = useState<number>(0)
	const { activeFloor, setActiveFloor } = useActiveFloor()
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
	const [isDebug] = useState(true)

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

	const handleDebugRightClick = useCallback(
		(coords: {
			screen: { x: number; y: number }
			world: { x: number; y: number }
		}) => {
			const point = {
				x: Math.floor(coords.world.x),
				y: Math.floor(coords.world.y),
				floor: activeFloor,
			}

			if (!start) {
				setStart(point)
				return
			}

			setEnd(point)
		},
		[activeFloor, setEnd, setStart, start],
	)

	const handleViewportChange = useCallback((next: ViewportState) => {
		setRotation(next.rotation)
	}, [])

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

			const floor = mapData.find((f) => f.id === floorId)
			if (!floor) return

			const bounds = collectBounds(floor)
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

	const filteredFloors = useFilteredFloors(mapData, activeCampus)

	useMapInteractions({
		fabricRef,
		zoomAtPoint,
		rotateAtCenter,
		applyViewport,
		viewportRef,
		screenToWorld,
		onRoomClick: (roomId) => setSelectedRoomId(roomId),
		onPointerMove: isDebug ? setCursorCoords : undefined,
		onRightClick: isDebug ? handleDebugRightClick : undefined,
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
		route: routeData?.route,
		enabled: isCanvasReady,
	})

	return (
		<div className="relative h-full w-full overflow-hidden bg-[#1B2329]">
			<canvas ref={canvasRef} className="size-full" />

			{isDebug && cursorCoords && (
				<div
					className="pointer-events-none absolute rounded-md bg-neutral-900/80 px-2 py-1 text-xs text-white shadow"
					style={{
						left: cursorCoords.screen.x + 10,
						top: cursorCoords.screen.y + 10,
					}}
				>
					<div>
						{cursorCoords.world.x.toFixed(0)}, {cursorCoords.world.y.toFixed(0)}
					</div>
				</div>
			)}

			<div className="absolute top-2 left-2 bg-card border-border flex flex-col gap-2 rounded-lg">
				<button
					type="button"
					className="size-8 text-xs grid place-items-center"
					onClick={() => setActiveCampus(activeCampus === 0 ? 1 : 0)}
				>
					{activeCampus === 0 ? "МИДИС" : "Школа"}
				</button>
				{filteredFloors?.map((floor) => (
					<button
						key={floor.id}
						type="button"
						className={cn(
							"size-8 text-xs grid place-items-center rounded-lg",
							activeFloor === floor.id && "bg-accent text-accent-foreground",
						)}
						onClick={() => {
							setActiveFloor(floor.id)
							centerOnFloor(floor.id)
						}}
					>
						{floor.acronym ?? floor.name}
					</button>
				))}
			</div>

			<div className="absolute top-2 right-2 bg-card border-border flex flex-col gap-2 rounded-lg">
				<button
					type="button"
					className="size-8 text-lg grid place-items-center rounded-lg"
					onClick={() => zoomByStep(1.2)}
				>
					<Icon name="add-16" />
				</button>
				<button
					type="button"
					className="size-8 text-lg grid place-items-center rounded-lg"
					onClick={() => zoomByStep(1 / 1.2)}
				>
					<Icon name="minus-16" />
				</button>
				{rotation !== 0 && (
					<button
						type="button"
						className="size-8 text-lg grid place-items-center rounded-lg"
						onClick={resetRotation}
					>
						<motion.span
							initial={{ rotate: (rotation * 180 - 140) / Math.PI }}
							animate={{ rotate: (rotation * 180 - 140) / Math.PI }}
						>
							<Icon name="compass-24" size={16} />
						</motion.span>
					</button>
				)}
			</div>

			<ModalRoot
				isOpen={selectedRoomId !== null}
				onClose={() => setSelectedRoomId(null)}
			>
				<RoomModal
					roomId={selectedRoomId}
					onClose={() => setSelectedRoomId(null)}
				/>
			</ModalRoot>
		</div>
	)
}
