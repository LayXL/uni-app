import * as fabric from "fabric"
import { type RefObject, useEffect, useRef } from "react"

import type { Floor } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import { clamp, getFloorPolygon, getRoomPolygon } from "../lib/geometry"
import type { ViewportState } from "../types"

type UseFloorRenderParams = {
	fabricRef: RefObject<fabric.Canvas | null>
	data: Floor[] | undefined
	activeFloor: number
	applyViewport?: (next: ViewportState) => void
	viewportRef: RefObject<ViewportState>
	textObjectsRef: RefObject<fabric.Text[]>
	labelBaseSizeRef: RefObject<WeakMap<fabric.FabricText, number>>
	iconObjectsRef: RefObject<fabric.Object[]>
	iconBaseScaleRef: RefObject<WeakMap<fabric.Object, number>>
	isDebug: boolean
	route?: RoutePoint[]
	enabled?: boolean
}

type RoutePoint = {
	floor: number
	x: number
	y: number
	type: "road" | "stairs"
	toFloor?: number | null
}

export const useFloorRender = ({
	fabricRef,
	data,
	activeFloor,
	viewportRef,
	textObjectsRef,
	labelBaseSizeRef,
	iconObjectsRef,
	iconBaseScaleRef,
	isDebug,
	route,
	enabled = true,
}: UseFloorRenderParams) => {
	const routeObjectsRef = useRef<fabric.Object[]>([])

	useEffect(() => {
		if (!enabled) return

		let disposed = false

		const canvas = fabricRef.current
		if (!canvas) return

		const floor = data?.find((f) => f.id === activeFloor)
		if (!floor) {
			canvas.clear()
			routeObjectsRef.current = []
			return
		}

		canvas.clear()
		textObjectsRef.current = []
		iconObjectsRef.current = []
		iconBaseScaleRef.current = new WeakMap()
		routeObjectsRef.current = []

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

		if (isDebug && floor.roads?.length) {
			floor.roads.forEach((road) => {
				const roadLine = new fabric.Line(
					[
						road.start.x + floor.position.x,
						road.start.y + floor.position.y,
						road.end.x + floor.position.x,
						road.end.y + floor.position.y,
					],
					{
						stroke: colors.roomStroke,
						strokeDashArray: [8, 8],
						strokeWidth: 2,
						strokeLineCap: "round",
						hoverCursor: "default",
						objectCaching: false,
						selectable: false,
						evented: false,
					},
				)

				canvas.add(roadLine)
			})
		}

		const fontFamily =
			(typeof window !== "undefined" &&
				getComputedStyle(document.body).fontFamily) ||
			"Inter, sans-serif"

		floor.stairs?.forEach((stair) => {
			const x = floor.position.x + stair.position.x
			const y = floor.position.y + stair.position.y

			const imgEl = new Image()
			imgEl.crossOrigin = "anonymous"
			imgEl.src = "/icons/stairs.svg"
			imgEl.onload = () => {
				if (disposed || !fabricRef.current) return

				const img = new fabric.FabricImage(imgEl, {
					originX: "center",
					originY: "center",
					objectCaching: false,
				})

				if (fabric.filters?.BlendColor) {
					img.filters = [
						new fabric.filters.BlendColor({
							color: colors.stairsIcon,
							mode: "add",
						}),
					]
					img.applyFilters()
				}

				const targetSize = 14
				const scaleX = img.width && img.width > 0 ? targetSize / img.width : 1
				const scaleY =
					img.height && img.height > 0 ? targetSize / img.height : 1

				img.set({
					scaleX,
					scaleY,
				})

				const marker = new fabric.Group(
					[
						new fabric.Circle({
							radius: 10,
							fill: colors.roomStroke,
							originX: "center",
							originY: "center",
						}),
						img,
					],
					{
						left: x,
						top: y,
						originX: "center",
						originY: "center",
						hoverCursor: "default",
						selectable: false,
						evented: false,
						objectCaching: false,
					},
				)

				const baseScale = marker.scaleX ?? 1
				iconBaseScaleRef.current.set(marker, baseScale)
				iconObjectsRef.current.push(marker)

				// Apply current zoom-based scaling immediately after creation
				const currentZoom = viewportRef.current.zoom
				const iconFontScale = clamp(1 / currentZoom ** 0.7, 0.75, 4)
				marker.set({
					scaleX: baseScale * iconFontScale,
					scaleY: baseScale * iconFontScale,
				})

				fabricRef.current.add(marker)
				fabricRef.current.requestRenderAll()
			}
		})

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

			;(roomPolygon as fabric.Object & { data?: { roomId?: number } }).data = {
				roomId: room.id,
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

		// Apply current zoom-based scaling to labels immediately after creation
		const currentZoom = viewportRef.current.zoom
		const fontScale = clamp(1 / currentZoom ** 0.7, 0.75, 4)

		labels.forEach((label) => {
			const baseFontSize = labelBaseSizeRef.current.get(label) ?? 14
			label.set("fontSize", baseFontSize * fontScale)
			label.set("dirty", true)
		})

		canvas.requestRenderAll()

		return () => {
			disposed = true
		}
	}, [
		activeFloor,
		fabricRef,
		data,
		labelBaseSizeRef,
		textObjectsRef,
		viewportRef,
		iconObjectsRef,
		iconBaseScaleRef,
		isDebug,
		enabled,
	])

	useEffect(() => {
		const canvas = fabricRef.current
		if (!canvas) return

		if (routeObjectsRef.current.length) {
			routeObjectsRef.current.forEach((object) => {
				canvas.remove(object)
			})
			routeObjectsRef.current = []
		}

		if (!route?.length) return

		const floor = data?.find((f) => f.id === activeFloor)
		if (!floor) return

		const withOffset = (point: RoutePoint) =>
			new fabric.Point(point.x + floor.position.x, point.y + floor.position.y)

		let chain: fabric.Point[] = []

		const flushChain = () => {
			if (chain.length < 2) {
				chain = []
				return
			}

			const polyline = new fabric.Polyline(chain, {
				stroke: "#22c55e",
				strokeWidth: 6,
				strokeLineCap: "round",
				strokeLineJoin: "round",
				strokeUniform: true,
				fill: undefined,
				opacity: 0.9,
				hoverCursor: "default",
				selectable: false,
				evented: false,
				objectCaching: false,
			})

			routeObjectsRef.current.push(polyline)
			canvas.add(polyline)
			chain = []
		}

		route.forEach((point, index) => {
			if (point.floor !== activeFloor) {
				flushChain()
				return
			}

			const prevSameFloor = index > 0 && route[index - 1]?.floor === activeFloor
			const nextSameFloor =
				index + 1 < route.length && route[index + 1]?.floor === activeFloor

			if (!prevSameFloor) {
				chain = [withOffset(point)]
			} else {
				chain.push(withOffset(point))
			}

			if (!nextSameFloor) {
				flushChain()
			}
		})

		return () => {
			if (!canvas) return
			if (!routeObjectsRef.current.length) return

			routeObjectsRef.current.forEach((object) => {
				canvas.remove(object)
			})
			routeObjectsRef.current = []
		}
	}, [activeFloor, data, fabricRef, route])
}
