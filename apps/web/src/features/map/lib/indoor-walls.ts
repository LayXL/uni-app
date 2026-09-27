import { Path, Shape, ShapeUtils, Vector2 } from "three"

import type { Coordinate } from "@repo/shared/building-scheme"

import { wallSegments } from "./indoor-geometry"

const samePoint = (a: Coordinate, b: Coordinate) =>
	Math.hypot(a.x - b.x, a.y - b.y) < 0.000001

/** Keep corners connected, but leave each doorway as an open end. */
const wallChains = (points: Coordinate[], doors: Coordinate[]) => {
	const chains: Coordinate[][] = []
	const segments = wallSegments(points, doors)
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
): Shape[] =>
	wallChains(points, doors).map((chain) => {
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
