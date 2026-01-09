import * as fabric from "fabric"
import { type RefObject, useEffect, useRef } from "react"

import type { BuildingScheme, Place, Room } from "@repo/shared/building-scheme"
import { isPlace, isRoom } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import { clamp, getFloorPolygon, getRoomPolygon } from "../lib/geometry"
import type { ViewportState } from "../types"

const iconImageCache = new Map<string, Promise<HTMLImageElement>>()

const getCachedIcon = (src: string) => {
	if (!iconImageCache.has(src)) {
		iconImageCache.set(
			src,
			new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image()
				img.crossOrigin = "anonymous"
				img.onload = () => resolve(img)
				img.onerror = (error) => reject(error)
				img.src = src
			}),
		)
	}

	const cached = iconImageCache.get(src)
	if (!cached) {
		return Promise.reject(new Error(`Icon not found: ${src}`))
	}
	return cached
}

type UseFloorRenderParams = {
	fabricRef: RefObject<fabric.Canvas | null>
	data: BuildingScheme | undefined
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

	// Preload all icons once when data is available
	useEffect(() => {
		if (!data) return

		const iconsToPreload = new Set<string>()

		// Add stairs icon
		iconsToPreload.add("/icons/stairs.svg")

		// Collect all room icons
		data.entities.forEach((entity) => {
			if (isRoom(entity) && entity.icon) {
				iconsToPreload.add(`/icons/${entity.icon}.svg`)
			}
			if (isPlace(entity)) {
				const iconName = entity.icon || entity.placeType || "place"
				iconsToPreload.add(`/icons/${iconName}.svg`)
			}
		})

		// Preload all icons
		iconsToPreload.forEach((iconSrc) => {
			getCachedIcon(iconSrc).catch(() => {
				// Ignore errors for missing icons
			})
		})
	}, [data])

	useEffect(() => {
		if (!enabled) return

		let disposed = false

		const canvas = fabricRef.current
		if (!canvas) return

		const floor = data?.floors.find((f) => f.id === activeFloor)
		if (!floor) {
			canvas.clear()
			routeObjectsRef.current = []
			return
		}

		const floorRooms =
			data?.entities.filter(
				(e): e is Room => isRoom(e) && e.floorId === activeFloor,
			) ?? []

		const floorPlaces =
			data?.entities.filter(
				(e): e is Place => isPlace(e) && e.floorId === activeFloor,
			) ?? []

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

		const asyncMarkers: Promise<fabric.Object | null>[] = []

		floor.stairs?.forEach((stair) => {
			const x = floor.position.x + stair.position.x
			const y = floor.position.y + stair.position.y

			asyncMarkers.push(
				getCachedIcon("/icons/stairs.svg")
					.then((imgEl) => {
						if (disposed) return null

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
						const scaleX =
							img.width && img.width > 0 ? targetSize / img.width : 1
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

						return marker
					})
					.catch(() => null),
			)
		})

		// Render places (points of interest)
		floorPlaces.forEach((place) => {
			const x = floor.position.x + place.position.x
			const y = floor.position.y + place.position.y

			const iconName = place.icon || place.placeType || "place"

			asyncMarkers.push(
				getCachedIcon(`/icons/${iconName}.svg`)
					.then((imgEl) => {
						if (disposed) return null

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
						const scaleX =
							img.width && img.width > 0 ? targetSize / img.width : 1
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

						return marker
					})
					.catch(() => null),
			)
		})

		const labels: fabric.FabricText[] = []

		floorRooms.forEach((room) => {
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

				const centerX = floor.position.x + room.position.x + centroid.x
				const centerY = floor.position.y + room.position.y + centroid.y

				// If room has an icon, render icon with text below
				if (room.icon) {
					asyncMarkers.push(
						getCachedIcon(`/icons/${room.icon}.svg`)
							.then((imgEl) => {
								if (disposed) return null

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
								const scaleX =
									img.width && img.width > 0 ? targetSize / img.width : 1
								const scaleY =
									img.height && img.height > 0 ? targetSize / img.height : 1

								img.set({
									scaleX,
									scaleY,
								})

								const iconCircle = new fabric.Circle({
									radius: 10,
									fill: colors.roomStroke,
									originX: "center",
									originY: "center",
									top: 0,
								})

								img.set({ top: 0 })

								const label = new fabric.FabricText(room.name, {
									fontSize: 14,
									fontFamily,
									fill: colors.roomLabel,
									originX: "center",
									originY: "top",
									top: 14,
									objectCaching: false,
								})

								const marker = new fabric.Group([iconCircle, img, label], {
									left: centerX,
									top: centerY,
									originX: "center",
									originY: "center",
									angle: (-viewportRef.current.rotation * 180) / Math.PI,
									hoverCursor: "default",
									selectable: false,
									evented: false,
									objectCaching: false,
								})

								return marker
							})
							.catch(() => null),
					)
				} else {
					// No icon, just render text as before
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
						new fabric.Point(centerX, centerY),
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

		Promise.all(asyncMarkers).then((markers) => {
			if (disposed || !fabricRef.current) return

			const validMarkers = markers.filter(
				(m): m is fabric.Group => m !== null,
			)

			if (validMarkers.length === 0) {
				canvas.requestRenderAll()
				return
			}

			validMarkers.forEach((marker) => {
				const baseScale = marker.scaleX ?? 1
				iconBaseScaleRef.current.set(marker, baseScale)
				iconObjectsRef.current.push(marker)

				// Apply current zoom-based scaling immediately after creation
				// Note: currentZoom might have changed since we started, so using viewportRef.current is correct
				const currentZoom = viewportRef.current.zoom
				const iconFontScale = clamp(1 / currentZoom ** 0.7, 0.75, 4)

				marker.set({
					scaleX: baseScale * iconFontScale,
					scaleY: baseScale * iconFontScale,
				})
			})

			canvas.add(...validMarkers)
			canvas.requestRenderAll()
		})

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

		const floor = data?.floors.find((f) => f.id === activeFloor)
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
