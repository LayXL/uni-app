import { Path, Shape, ShapeUtils, Vector2 } from "three"

import type { Coordinate } from "@repo/shared/building-scheme"

import { wallSegments } from "./indoor-geometry"

const samePoint = (a: Coordinate, b: Coordinate) =>
	Math.hypot(a.x - b.x, a.y - b.y) < 0.000001

type WallSegment = ReturnType<typeof wallSegments>[number]

/** Remove coincident taller walls instead of drawing two gradients on one face. */
const uncoveredSegments = (segment: WallSegment, coveredBy: WallSegment[]) => {
	const { start, end } = segment
	const dx = end.x - start.x
	const dy = end.y - start.y
	const length = Math.hypot(dx, dy)
	const along = (p: Coordinate) =>
		((p.x - start.x) * dx + (p.y - start.y) * dy) / length
	const distance = (p: Coordinate) =>
		Math.abs((p.x - start.x) * dy - (p.y - start.y) * dx) / length
	const gaps = coveredBy
		.flatMap((wall) => {
			if (distance(wall.start) > 0.001 || distance(wall.end) > 0.001) return []
			const a = along(wall.start)
			const b = along(wall.end)
			const from = Math.max(0, Math.min(a, b))
			const to = Math.min(length, Math.max(a, b))
			return to > from ? [[from, to]] : []
		})
		.sort((a, b) => a[0] - b[0])
	if (!gaps.length) return [segment]
	const at = (t: number): Coordinate => ({
		x: start.x + (dx * t) / length,
		y: start.y + (dy * t) / length,
	})
	const result: WallSegment[] = []
	let cursor = 0
	for (const [from, to] of [...gaps, [length, length]]) {
		if (from - cursor > 0.001) result.push({ start: at(cursor), end: at(from) })
		cursor = Math.max(cursor, to)
	}
	return result
}

/** Keep corners connected, but leave each doorway as an open end. */
const wallChains = (
	points: Coordinate[],
	doors: Coordinate[],
	coveredBy: WallSegment[],
) => {
	const chains: Coordinate[][] = []
	const segments = wallSegments(points, doors).flatMap((segment) =>
		uncoveredSegments(segment, coveredBy),
	)
	for (const { start, end } of segments) {
		const chain = chains.at(-1)
		if (chain && samePoint(chain[chain.length - 1], start)) chain.push(end)
		else chains.push([start, end])
	}
	const first = chains[0]
	const last = chains.at(-1)
	if (
		chains.length > 1 &&
		first &&
		last &&
		samePoint(last[last.length - 1], first[0])
	) {
		chains[0] = [...last, ...first.slice(1)]
		chains.pop()
	}
	return chains
}

const offsetChain = (points: Vector2[], closed: boolean, distance: number) => {
	const normals = points.slice(0, closed ? points.length : -1).map((p, i) => {
		const next = points[(i + 1) % points.length]
		return new Vector2(p.y - next.y, next.x - p.x).normalize()
	})
	return points.flatMap((p, i) => {
		const before = normals[(i + normals.length - 1) % normals.length]
		const after = normals[i % normals.length]
		if (!closed && (i === 0 || i === points.length - 1))
			return [p.clone().addScaledVector(i === 0 ? after : before, distance)]
		const denominator = 1 + before.dot(after)
		// Bevel near reversals instead of producing arbitrarily long spikes.
		if (denominator < 1 / 8)
			return [
				p.clone().addScaledVector(before, distance),
				p.clone().addScaledVector(after, distance),
			]
		return [
			p
				.clone()
				.addScaledVector(before.clone().add(after), distance / denominator),
		]
	})
}

/** Extrude these continuous footprints so corners share a single top surface. */
export const createWallShapes = (
	points: Coordinate[],
	doors: Coordinate[] = [],
	width = 6,
	coveredBy: WallSegment[] = [],
): Shape[] =>
	wallChains(points, doors, coveredBy).map((chain) => {
		const closed = samePoint(chain[0], chain[chain.length - 1])
		const path = (closed ? chain.slice(0, -1) : chain).map(
			(p) => new Vector2(p.x, -p.y),
		)
		const left = offsetChain(path, closed, width / 2)
		const right = offsetChain(path, closed, -width / 2)
		if (!closed) return new Shape([...left, ...right.reverse()])
		const [outer, inner] =
			Math.abs(ShapeUtils.area(left)) > Math.abs(ShapeUtils.area(right))
				? [left, right]
				: [right, left]
		// ExtrudeGeometry does not always normalize holes when the outer ring
		// is already clockwise. Explicit winding keeps interior faces visible.
		if (!ShapeUtils.isClockWise(outer)) outer.reverse()
		if (ShapeUtils.isClockWise(inner)) inner.reverse()
		const shape = new Shape(outer)
		shape.holes.push(new Path(inner))
		return shape
	})
