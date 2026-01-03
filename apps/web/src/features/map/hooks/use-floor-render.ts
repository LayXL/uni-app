import * as fabric from "fabric"
import { useEffect } from "react"

import type { Floor } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import {
	clamp,
	collectBounds,
	getFloorPolygon,
	getRoomPolygon,
} from "../lib/geometry"
import type { ViewportState } from "../types"

type UseFloorRenderParams = {
	fabricRef: React.MutableRefObject<fabric.Canvas | null>
	data: Floor[] | undefined
	activeFloor: number
	applyViewport: (next: ViewportState) => void
	viewportRef: React.MutableRefObject<ViewportState>
	textObjectsRef: React.MutableRefObject<fabric.Text[]>
	labelBaseSizeRef: React.MutableRefObject<WeakMap<fabric.FabricText, number>>
}

export const useFloorRender = ({
	fabricRef,
	data,
	activeFloor,
	applyViewport,
	viewportRef,
	textObjectsRef,
	labelBaseSizeRef,
}: UseFloorRenderParams) => {
	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		const floor = data?.find((f) => f.id === activeFloor)
		if (!floor) {
			canvas.clear()
			return
		}

		canvas.clear()
		textObjectsRef.current = []

		const colors = getMapColors()

		const floorPolygon = new fabric.Polygon(getFloorPolygon(floor), {
			fill: colors.floorFill,
			stroke: colors.floorStroke,
			strokeWidth: 2,
			hoverCursor: "default",
			objectCaching: false,
			evented: false,
		})

		canvas.add(floorPolygon)

		const fontFamily =
			(typeof window !== "undefined" &&
				getComputedStyle(document.body).fontFamily) ||
			"Inter, sans-serif"

		const labels: fabric.FabricText[] = []

		floor.rooms?.forEach((room) => {
			const roomPolygon = new fabric.Polygon(
				getRoomPolygon(room, floor.position),
				{
					fill: room.clickable ? colors.roomFillClickable : colors.roomFill,
					stroke: colors.roomStroke,
					strokeWidth: 1,
					hoverCursor: "pointer",
					objectCaching: false,
					selectable: false,
					evented: true,
				},
			)

			;(roomPolygon as fabric.Object & { data?: { roomName?: string } }).data =
				{
					roomName: room.name,
				}

			canvas.add(roomPolygon)

			if (!room.nameHidden) {
				const walls = room.wallsPosition ?? []
				const centroid = walls.length
					? walls.reduce(
							(acc, point) => ({
								x: acc.x + point.x,
								y: acc.y + point.y,
							}),
							{ x: 0, y: 0 },
						)
					: { x: 0, y: 0 }

				if (walls.length) {
					centroid.x /= walls.length
					centroid.y /= walls.length
				}

				const label = new fabric.FabricText(room.name, {
					fontSize: 14,
					fontFamily,
					fill: colors.roomLabel,
					originX: "center",
					originY: "center",
					angle: (-viewportRef.current.rotation * 180) / Math.PI,
					objectCaching: false,
					evented: false,
				})

				label.setPositionByOrigin(
					new fabric.Point(
						floor.position.x + room.position.x + centroid.x,
						floor.position.y + room.position.y + centroid.y,
					),
					"center",
					"center",
				)

				label.set({
					left: Math.round(label.left ?? 0),
					top: Math.round(label.top ?? 0),
				})

				labels.push(label)
				labelBaseSizeRef.current.set(label, 14)
			}
		})

		labels.forEach((label) => {
			textObjectsRef.current.push(label)
			canvas.add(label)
		})

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
	}, [
		activeFloor,
		applyViewport,
		fabricRef,
		data,
		labelBaseSizeRef,
		textObjectsRef,
		viewportRef,
	])
}
