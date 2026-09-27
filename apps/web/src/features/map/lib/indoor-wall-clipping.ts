import {
	BufferGeometry,
	Float32BufferAttribute,
	type Shape,
	ShapeUtils,
	Vector2,
	Vector3,
} from "three"

// Extrusion stores world coordinates in Float32; allow for that rounding.
const epsilon = 0.001
type Bounds = { minX: number; maxX: number; minY: number; maxY: number }
type Footprint = { points: Vector2[]; bounds: Bounds }
type Vertex = { position: Vector3; normal: Vector3; uv: Vector2 }

const boundsOf = (points: Vector2[]): Bounds => ({
	minX: Math.min(...points.map((point) => point.x)),
	maxX: Math.max(...points.map((point) => point.x)),
	minY: Math.min(...points.map((point) => point.y)),
	maxY: Math.max(...points.map((point) => point.y)),
})

const overlaps = (a: Bounds, b: Bounds) =>
	a.minX <= b.maxX + epsilon &&
	a.maxX >= b.minX - epsilon &&
	a.minY <= b.maxY + epsilon &&
	a.maxY >= b.minY - epsilon

/** Triangulate actual wall footprints, including miters and doorway ends. */
export const wallFootprints = (shapes: Shape[]): Footprint[] =>
	shapes.flatMap((shape) => {
		const { shape: contour, holes } = shape.extractPoints(1)
		const triangles = ShapeUtils.triangulateShape(contour, holes)
		const vertices = [...contour, ...holes.flat()]
		return triangles.map((indices) => {
			// Shape y becomes -z after extrusion is rotated into the map plane.
			const points = indices.map(
				(i) => new Vector2(vertices[i].x, -vertices[i].y),
			)
			if (ShapeUtils.isClockWise(points)) points.reverse()
			return { points, bounds: boundsOf(points) }
		})
	})

const interpolate = (a: Vertex, b: Vertex, t: number): Vertex => ({
	position: a.position.clone().lerp(b.position, t),
	normal: a.normal.clone().lerp(b.normal, t),
	uv: a.uv.clone().lerp(b.uv, t),
})

/** Subtract a vertical triangular prism from a convex surface polygon. */
const subtract = (polygon: Vertex[], footprint: Footprint): Vertex[][] => {
	const outside: Vertex[][] = []
	let remaining = polygon
	for (let edge = 0; edge < 3 && remaining.length >= 3; edge++) {
		const a = footprint.points[edge]
		const b = footprint.points[(edge + 1) % 3]
		const length = a.distanceTo(b)
		const distance = ({ position: p }: Vertex) => {
			const d = ((b.x - a.x) * (p.z - a.y) - (b.y - a.y) * (p.x - a.x)) / length
			return Math.abs(d) < epsilon ? 0 : d
		}
		const inside: Vertex[] = []
		const removed: Vertex[] = []
		for (let i = 0; i < remaining.length; i++) {
			const start = remaining[i]
			const end = remaining[(i + 1) % remaining.length]
			const from = distance(start)
			const to = distance(end)
			if (from >= 0) inside.push(start)
			else removed.push(start)
			const startInside = from >= 0
			const endInside = to >= 0
			if (startInside !== endInside) {
				const intersection = interpolate(start, end, from / (from - to))
				inside.push(intersection)
				removed.push(intersection)
			}
		}
		if (removed.length >= 3) outside.push(removed)
		remaining = inside
	}
	return outside
}

/**
 * Remove low-wall surfaces inside taller walls, including coincident side faces.
 * Clipping surfaces (rather than centerlines) preserves corners and door gaps;
 * no end cap is added at a join, where the taller wall already closes the solid.
 * Consumes the non-indexed ExtrudeGeometry and returns its visible surfaces.
 */
export const clipWallGeometry = (
	geometry: BufferGeometry,
	coveredBy: Footprint[],
): BufferGeometry => {
	if (!coveredBy.length) return geometry
	const position = geometry.getAttribute("position")
	const normal = geometry.getAttribute("normal")
	const uv = geometry.getAttribute("uv")
	const positions: number[] = []
	const normals: number[] = []
	const uvs: number[] = []
	for (let i = 0; i < position.count; i += 3) {
		const triangle = [0, 1, 2].map(
			(offset): Vertex => ({
				position: new Vector3().fromBufferAttribute(position, i + offset),
				normal: new Vector3().fromBufferAttribute(normal, i + offset),
				uv: new Vector2(uv.getX(i + offset), uv.getY(i + offset)),
			}),
		)
		const bounds = boundsOf(
			triangle.map(({ position: p }) => new Vector2(p.x, p.z)),
		)
		let polygons = [triangle]
		for (const footprint of coveredBy) {
			if (!overlaps(bounds, footprint.bounds)) continue
			polygons = polygons.flatMap((polygon) => subtract(polygon, footprint))
			if (!polygons.length) break
		}
		for (const polygon of polygons) {
			for (let j = 1; j < polygon.length - 1; j++) {
				const vertices = [polygon[0], polygon[j], polygon[j + 1]]
				const area = vertices[1].position
					.clone()
					.sub(vertices[0].position)
					.cross(vertices[2].position.clone().sub(vertices[0].position))
					.lengthSq()
				if (area < epsilon * epsilon) continue
				for (const vertex of vertices) {
					positions.push(...vertex.position.toArray())
					normals.push(...vertex.normal.toArray())
					uvs.push(...vertex.uv.toArray())
				}
			}
		}
	}
	geometry.dispose()
	const clipped = new BufferGeometry()
	clipped.setAttribute("position", new Float32BufferAttribute(positions, 3))
	clipped.setAttribute("normal", new Float32BufferAttribute(normals, 3))
	clipped.setAttribute("uv", new Float32BufferAttribute(uvs, 2))
	return clipped
}
