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

// Process items in batches to avoid blocking the main thread
const processInBatches = async <T>(
	items: T[],
	processor: (item: T) => void,
	batchSize = 10,
): Promise<void> => {
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize)
		batch.forEach(processor)

		// Yield to the main thread between batches
		if (i + batchSize < items.length) {
			await new Promise((resolve) => setTimeout(resolve, 0))
		}
	}
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
	colorScheme?: "light" | "dark"
}

type RoutePoint = {
	floor: number
	x: number
	y: number
	type: "road" | "stairs"
	toFloor?: number | null
}

const getRoundedPath = (points: fabric.Point[], radius = 10): string => {
	if (points.length < 2) return ""

	let d = `M ${points[0].x} ${points[0].y}`

	for (let i = 1; i < points.length - 1; i++) {
		const p0 = points[i - 1]
		const p1 = points[i]
		const p2 = points[i + 1]

		const v1 = { x: p1.x - p0.x, y: p1.y - p0.y }
		const v2 = { x: p2.x - p1.x, y: p2.y - p1.y }

		const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
		const l2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

		const r = Math.min(radius, l1 / 2, l2 / 2)

		if (r < 1) {
			d += ` L ${p1.x} ${p1.y}`
			continue
		}

		const startX = p1.x - (v1.x / l1) * r
		const startY = p1.y - (v1.y / l1) * r

		const endX = p1.x + (v2.x / l2) * r
		const endY = p1.y + (v2.y / l2) * r

		d += ` L ${startX} ${startY}`
		d += ` Q ${p1.x} ${p1.y} ${endX} ${endY}`
	}

	const last = points[points.length - 1]
	d += ` L ${last.x} ${last.y}`

	return d
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
	colorScheme,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: colorScheme triggers re-render to update CSS-based colors from getMapColors()
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

		const labels: fabric.FabricText[] = []

		// Render rooms synchronously (polygons and text labels without icons)
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

			if (!room.nameHidden && !room.icon) {
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

		// Render floor and rooms immediately
		canvas.requestRenderAll()

		// Helper function to create an icon marker (without filters for performance)
		const createIconMarker = (
			imgEl: HTMLImageElement,
			x: number,
			y: number,
			extraObjects?: fabric.FabricObject[],
		): fabric.Group => {
			const img = new fabric.FabricImage(imgEl, {
				originX: "center",
				originY: "center",
				objectCaching: true, // Enable caching for better performance
			})

			const targetSize = 14
			const scaleX = img.width && img.width > 0 ? targetSize / img.width : 1
			const scaleY = img.height && img.height > 0 ? targetSize / img.height : 1

			img.set({ scaleX, scaleY })

			const groupObjects: fabric.FabricObject[] = [
				new fabric.Circle({
					radius: 10,
					fill: colors.roomStroke,
					originX: "center",
					originY: "center",
				}),
				img,
				...(extraObjects ?? []),
			]

			return new fabric.Group(groupObjects, {
				left: x,
				top: y,
				originX: "center",
				originY: "center",
				hoverCursor: "default",
				selectable: false,
				evented: false,
				objectCaching: true, // Enable caching for better performance
			})
		}

		// Collect all icon tasks to process in batches
		type IconTask = {
			iconSrc: string
			x: number
			y: number
			extraObjects?: fabric.FabricObject[]
			angle?: number
		}

		const iconTasks: IconTask[] = []

		// Collect stairs icons
		floor.stairs?.forEach((stair) => {
			iconTasks.push({
				iconSrc: "/icons/stairs.svg",
				x: floor.position.x + stair.position.x,
				y: floor.position.y + stair.position.y,
			})
		})

		// Collect place icons
		floorPlaces.forEach((place) => {
			const iconName = place.icon || place.placeType || "place"
			iconTasks.push({
				iconSrc: `/icons/${iconName}.svg`,
				x: floor.position.x + place.position.x,
				y: floor.position.y + place.position.y,
			})
		})

		// Collect room icons
		floorRooms.forEach((room) => {
			if (!room.nameHidden && room.icon) {
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

				const label = new fabric.FabricText(room.name, {
					fontSize: 14,
					fontFamily,
					fill: colors.roomLabel,
					originX: "center",
					originY: "top",
					top: 14,
					objectCaching: true,
				})

				iconTasks.push({
					iconSrc: `/icons/${room.icon}.svg`,
					x: centerX,
					y: centerY,
					extraObjects: [label],
					angle: (-viewportRef.current.rotation * 180) / Math.PI,
				})
			}
		})

		// Process icons asynchronously in batches
		const loadAndRenderIcons = async () => {
			if (disposed || !fabricRef.current) return

			// First, load all icons in parallel
			const loadedIcons = await Promise.all(
				iconTasks.map(async (task) => {
					try {
						const imgEl = await getCachedIcon(task.iconSrc)
						return { ...task, imgEl }
					} catch {
						return null
					}
				}),
			)

			const validIcons = loadedIcons.filter(
				(icon): icon is NonNullable<typeof icon> => icon !== null,
			)

			if (disposed || !fabricRef.current) return

			// Create markers in batches to avoid blocking
			const markers: fabric.Group[] = []

			await processInBatches(
				validIcons,
				(iconData) => {
					if (disposed) return

					const marker = createIconMarker(
						iconData.imgEl,
						iconData.x,
						iconData.y,
						iconData.extraObjects,
					)

					if (iconData.angle !== undefined) {
						marker.set({ angle: iconData.angle })
					}

					markers.push(marker)
				},
				15, // Process 15 icons per batch
			)

			if (disposed || !fabricRef.current) return

			// Add all markers to canvas in one batch
			const iconFontScale = clamp(1 / viewportRef.current.zoom ** 0.7, 0.75, 4)

			markers.forEach((marker) => {
				const baseScale = marker.scaleX ?? 1
				iconBaseScaleRef.current.set(marker, baseScale)
				iconObjectsRef.current.push(marker)

				marker.set({
					scaleX: baseScale * iconFontScale,
					scaleY: baseScale * iconFontScale,
				})

				fabricRef.current?.add(marker)
			})

			// Single render call after all icons are added
			fabricRef.current?.requestRenderAll()
		}

		// Start icon loading asynchronously
		loadAndRenderIcons()

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
		colorScheme,
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

		const colors = getMapColors()

		const withOffset = (point: RoutePoint) =>
			new fabric.Point(point.x + floor.position.x, point.y + floor.position.y)

		let chain: fabric.Point[] = []

		const flushChain = () => {
			if (chain.length < 2) {
				chain = []
				return
			}

			const pathData = getRoundedPath(chain, 15)
			const polyline = new fabric.Path(pathData, {
				stroke: colors.route,
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

			const objects = canvas.getObjects()
			let insertIndex = objects.indexOf(polyline)
			const originalIndex = insertIndex

			const firstLabel = textObjectsRef.current[0]
			if (firstLabel) {
				const idx = objects.indexOf(firstLabel)
				if (idx > -1 && idx < insertIndex) {
					insertIndex = idx
				}
			}

			const firstIcon = iconObjectsRef.current[0]
			if (firstIcon) {
				const idx = objects.indexOf(firstIcon)
				if (idx > -1 && idx < insertIndex) {
					insertIndex = idx
				}
			}

			if (insertIndex < originalIndex) {
				canvas.moveObjectTo(polyline, insertIndex)
			}

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
	}, [activeFloor, data, fabricRef, route, iconObjectsRef, textObjectsRef])
}
