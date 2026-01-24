import * as THREE from "three"

import type { Coordinate, Floor, Room } from "@repo/shared/building-scheme"

/**
 * Convert 2D polygon coordinates to THREE.Shape for extrusion
 */
export const createShapeFromPolygon = (
	points: Coordinate[],
	offset: Coordinate = { x: 0, y: 0 },
): THREE.Shape => {
	const shape = new THREE.Shape()

	if (points.length === 0) return shape

	const firstPoint = points[0]
	shape.moveTo(firstPoint.x + offset.x, firstPoint.y + offset.y)

	for (let i = 1; i < points.length; i++) {
		const point = points[i]
		shape.lineTo(point.x + offset.x, point.y + offset.y)
	}

	shape.closePath()
	return shape
}

/**
 * Create floor shape from floor data
 */
export const createFloorShape = (floor: Floor): THREE.Shape => {
	return createShapeFromPolygon(floor.wallsPosition, floor.position)
}

/**
 * Create room shape from room data with floor offset
 */
export const createRoomShape = (
	room: Room,
	floorOffset: Coordinate,
): THREE.Shape => {
	return createShapeFromPolygon(room.wallsPosition, {
		x: floorOffset.x + room.position.x,
		y: floorOffset.y + room.position.y,
	})
}

/**
 * Calculate centroid of a polygon
 */
export const getPolygonCentroid = (
	points: Coordinate[],
	offset: Coordinate = { x: 0, y: 0 },
): Coordinate => {
	if (points.length === 0) return { x: 0, y: 0 }

	const sum = points.reduce(
		(acc, point) => ({
			x: acc.x + point.x,
			y: acc.y + point.y,
		}),
		{ x: 0, y: 0 },
	)

	return {
		x: sum.x / points.length + offset.x,
		y: sum.y / points.length + offset.y,
	}
}

/**
 * Calculate bounds of a floor including all rooms
 */
export const calculateFloorBounds = (
	floor: Floor,
	rooms: Room[],
): { center: Coordinate; width: number; height: number } => {
	const allPoints: Coordinate[] = []

	// Add floor points
	floor.wallsPosition.forEach((p) => {
		allPoints.push({
			x: p.x + floor.position.x,
			y: p.y + floor.position.y,
		})
	})

	// Add room points
	rooms.forEach((room) => {
		room.wallsPosition.forEach((p) => {
			allPoints.push({
				x: p.x + floor.position.x + room.position.x,
				y: p.y + floor.position.y + room.position.y,
			})
		})
	})

	if (allPoints.length === 0) {
		return { center: { x: 0, y: 0 }, width: 1, height: 1 }
	}

	const bounds = allPoints.reduce(
		(acc, p) => ({
			minX: Math.min(acc.minX, p.x),
			maxX: Math.max(acc.maxX, p.x),
			minY: Math.min(acc.minY, p.y),
			maxY: Math.max(acc.maxY, p.y),
		}),
		{
			minX: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY,
		},
	)

	return {
		center: {
			x: (bounds.minX + bounds.maxX) / 2,
			y: (bounds.minY + bounds.maxY) / 2,
		},
		width: bounds.maxX - bounds.minX,
		height: bounds.maxY - bounds.minY,
	}
}

/**
 * Constants for 3D rendering
 */
export const MAP_3D_CONSTANTS = {
	FLOOR_HEIGHT: 0.3,
	ROOM_HEIGHT: 0.1,
	WALL_HEIGHT: 32,
	ROOM_WALL_HEIGHT: 32,
	WALL_THICKNESS: 1.5,
	FLOOR_ELEVATION: 0,
	ROOM_ELEVATION: 0.3,
} as const

/**
 * Wall segment data for 3D rendering
 */
export type WallSegment = {
	start: Coordinate
	end: Coordinate
	length: number
	angle: number
	centerX: number
	centerY: number
}

/**
 * Calculate signed area of polygon (positive = counter-clockwise, negative = clockwise)
 */
const getPolygonSignedArea = (points: Coordinate[]): number => {
	let area = 0
	for (let i = 0; i < points.length; i++) {
		const j = (i + 1) % points.length
		area += points[i].x * points[j].y
		area -= points[j].x * points[i].y
	}
	return area / 2
}

/**
 * Create wall segments from polygon points with optional inset
 * @param inset - Distance to move walls inward (for room walls to avoid overlap)
 */
export const createWallSegments = (
	points: Coordinate[],
	offset: Coordinate = { x: 0, y: 0 },
	inset = 0,
): WallSegment[] => {
	const segments: WallSegment[] = []

	// Determine polygon winding direction
	const signedArea = getPolygonSignedArea(points)
	const isClockwise = signedArea < 0

	for (let i = 0; i < points.length; i++) {
		const start = points[i]
		const end = points[(i + 1) % points.length]

		const startX = start.x + offset.x
		const startY = start.y + offset.y
		const endX = end.x + offset.x
		const endY = end.y + offset.y

		const dx = endX - startX
		const dy = endY - startY
		const length = Math.sqrt(dx * dx + dy * dy)
		const angle = Math.atan2(dy, dx)

		// Calculate center
		let centerX = (startX + endX) / 2
		let centerY = (startY + endY) / 2

		// Apply inset - move wall inward perpendicular to wall direction
		if (inset !== 0 && length > 0) {
			// Normal perpendicular to wall (pointing inward)
			// For clockwise polygon, inward is to the left (-dy, dx)
			// For counter-clockwise, inward is to the right (dy, -dx)
			const nx = isClockwise ? -dy / length : dy / length
			const ny = isClockwise ? dx / length : -dx / length

			centerX += nx * inset
			centerY += ny * inset
		}

		segments.push({
			start: { x: startX, y: startY },
			end: { x: endX, y: endY },
			length,
			angle,
			centerX,
			centerY,
		})
	}

	return segments
}
