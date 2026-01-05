import * as fabric from "fabric"

import type { Coordinate, Floor, Room } from "@repo/shared/building-scheme"

import type { FabricMatrix, ViewportState } from "../types"

export const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max)

export const createViewportMatrix = (state: ViewportState): FabricMatrix => {
	const cos = Math.cos(state.rotation)
	const sin = Math.sin(state.rotation)

	return [
		state.zoom * cos,
		state.zoom * sin,
		-state.zoom * sin,
		state.zoom * cos,
		state.translateX,
		state.translateY,
	] satisfies FabricMatrix
}

const toCanvasPoint = (coord: Coordinate, offset?: Coordinate): fabric.Point =>
	new fabric.Point(coord.x + (offset?.x ?? 0), coord.y + (offset?.y ?? 0))

export const getRoomPolygon = (
	room: Room,
	floorOffset: Coordinate,
): fabric.Point[] =>
	room.wallsPosition.map((p) =>
		toCanvasPoint(p, {
			x: floorOffset.x + room.position.x,
			y: floorOffset.y + room.position.y,
		}),
	)

export const getFloorPolygon = (floor: Floor): fabric.Point[] =>
	floor.wallsPosition.map((p) => toCanvasPoint(p, floor.position))

export const collectBounds = (floor: Floor, rooms: Room[]) => {
	const points: Coordinate[] = []

	getFloorPolygon(floor).forEach((p) => {
		points.push({ x: p.x, y: p.y })
	})

	const floorRooms = rooms.filter((r) => r.floorId === floor.id)

	floorRooms.forEach((room) => {
		getRoomPolygon(room, floor.position).forEach((p) => {
			points.push({ x: p.x, y: p.y })
		})
	})

	if (points.length === 0) {
		return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
	}

	return points.reduce(
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
}
