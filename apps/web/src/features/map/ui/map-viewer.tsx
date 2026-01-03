"use client"

import { useQuery } from "@tanstack/react-query"
import * as fabric from "fabric"
import { motion } from "motion/react"
import { useCallback, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { Icon } from "@/shared/ui/icon"
import { ModalRoot } from "@/shared/ui/modal-root"
import { cn } from "@/shared/utils/cn"

import { useFilteredFloors } from "../hooks/use-filtered-floors"
import { useFloorRender } from "../hooks/use-floor-render"
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapInteractions } from "../hooks/use-map-interactions"
import { useMapViewport } from "../hooks/use-map-viewport"
import type { ViewportState } from "../types"
import { RoomModal } from "./room-modal"

export const MapViewer = () => {
	const { data } = useQuery(orpc.map.getMap.queryOptions())

	const [activeCampus, setActiveCampus] = useState<number>(0)
	const [activeFloor, setActiveFloor] = useState<number>(0)
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
	const [isDebug] = useState(true)

	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	const { fabricRef } = useMapCanvas({ canvasRef })

	const textObjectsRef = useRef<fabric.Text[]>([])
	const labelBaseSizeRef = useRef(new WeakMap<fabric.FabricText, number>())
	const [rotation, setRotation] = useState(0)

	const handleViewportChange = useCallback((next: ViewportState) => {
		setRotation(next.rotation)
	}, [])

	const { viewportRef, applyViewport, zoomAtPoint, rotateAtCenter } =
		useMapViewport({
			fabricRef,
			textObjectsRef,
			labelBaseSizeRef,
			onViewportChange: handleViewportChange,
		})

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
		[fabricRef, zoomAtPoint],
	)

	const resetRotation = useCallback(() => {
		const currentRotation = viewportRef.current.rotation
		if (Math.abs(currentRotation) < 0.001) return

		rotateAtCenter(-currentRotation)
	}, [rotateAtCenter, viewportRef])

	const filteredFloors = useFilteredFloors(data, activeCampus)

	useMapInteractions({
		fabricRef,
		zoomAtPoint,
		rotateAtCenter,
		applyViewport,
		viewportRef,
		onRoomClick: (roomId) => setSelectedRoomId(roomId),
	})

	useFloorRender({
		fabricRef,
		data,
		activeFloor,
		applyViewport,
		viewportRef,
		textObjectsRef,
		labelBaseSizeRef,
		isDebug,
	})

	return (
		<div className="relative h-full w-full overflow-hidden bg-[#1B2329]">
			<canvas ref={canvasRef} className="size-full" />

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
						onClick={() => setActiveFloor(floor.id)}
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
				<RoomModal roomId={selectedRoomId} />
			</ModalRoot>
		</div>
	)
}
