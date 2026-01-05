import z from "zod"

import type { Coordinate } from "@repo/shared/building-scheme"
import { getConfig } from "@repo/shared/config/get-config"

import { publicProcedure } from "../../procedures/public"
import { buildRoadsToRoomDoors } from "./utils/build-roads-to-room-doors"
import { projectPointToSegment } from "./utils/geometry"

type Point = Coordinate & { floor: number }

type GraphNode = {
	id: string
	floor: number
	x: number
	y: number
	neighbors: GraphEdge[]
}

type GraphEdge = {
	node: GraphNode
	weight: number
	type: "road" | "stairs"
	toFloor?: number
}

const getDist = (a: Coordinate, b: Coordinate) =>
	Math.hypot(a.x - b.x, a.y - b.y)

const createNodeId = (floor: number, x: number, y: number) =>
	`${floor}:${x.toFixed(2)}:${y.toFixed(2)}`

const arePointsClose = (a: Coordinate, b: Coordinate, eps = 1e-3) =>
	Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps

const segmentIntersection = (
	a1: Coordinate,
	a2: Coordinate,
	b1: Coordinate,
	b2: Coordinate,
): Coordinate | null => {
	// Based on line-line intersection with bounding-box check
	const x1 = a1.x
	const y1 = a1.y
	const x2 = a2.x
	const y2 = a2.y
	const x3 = b1.x
	const y3 = b1.y
	const x4 = b2.x
	const y4 = b2.y

	const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
	if (Math.abs(denom) < 1e-9) return null // Parallel or coincident; skip

	const px =
		((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom
	const py =
		((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom

	// Bounding-box check with small tolerance
	const within = (v: number, a: number, b: number, eps = 1e-6) =>
		v + eps >= Math.min(a, b) && v - eps <= Math.max(a, b)

	if (
		within(px, x1, x2) &&
		within(py, y1, y2) &&
		within(px, x3, x4) &&
		within(py, y3, y4)
	) {
		return { x: px, y: py }
	}

	return null
}

export const routeSchema = z.array(
	z.object({
		floor: z.number(),
		x: z.number(),
		y: z.number(),
		type: z.enum(["road", "stairs"]).default("road"),
		toFloor: z.number().optional(),
	}),
)

export const buildRoute = publicProcedure
	.input(
		z.object({
			start: z.object({
				floor: z.number(),
				x: z.number(),
				y: z.number(),
			}),
			end: z.object({
				floor: z.number(),
				x: z.number(),
				y: z.number(),
			}),
		}),
	)
	.output(z.object({ route: routeSchema }))
	.handler(async ({ input }) => {
		const buildingScheme = buildRoadsToRoomDoors(
			await getConfig("buildingScheme"),
		)

		const nodes = new Map<string, GraphNode>()

		const getNode = (floor: number, x: number, y: number) => {
			const id = createNodeId(floor, x, y)
			const existing = nodes.get(id)
			if (existing) return existing
			const created: GraphNode = { id, floor, x, y, neighbors: [] }
			nodes.set(id, created)
			return created
		}

		const addEdge = (
			u: GraphNode,
			v: GraphNode,
			weight: number,
			type: "road" | "stairs",
			toFloor?: number,
		) => {
			u.neighbors.push({ node: v, weight, type, toFloor })
		}

		// Store stair projections to link them later
		const stairProjections: {
			id: number
			floor: number
			point: Coordinate
		}[] = []

		let startNode: GraphNode | null = null
		let endNode: GraphNode | null = null

		for (const floor of buildingScheme.floors) {
			const floorRoads = floor.roads || []
			const pointsOnRoads: Map<number, Coordinate[]> = new Map()

			const addPointToRoad = (roadIdx: number, point: Coordinate) => {
				const list = pointsOnRoads.get(roadIdx)
				if (list) {
					const exists = list.some((p) => arePointsClose(p, point))
					if (!exists) list.push(point)
				} else {
					pointsOnRoads.set(roadIdx, [point])
				}
			}

			// 1. Add road endpoints
			floorRoads.forEach((road, idx) => {
				addPointToRoad(idx, road.start)
				addPointToRoad(idx, road.end)
			})

			// 1.5 Add intersections between roads on the same floor
			for (let i = 0; i < floorRoads.length; i++) {
				for (let j = i + 1; j < floorRoads.length; j++) {
					const r1 = floorRoads[i]
					const r2 = floorRoads[j]
					const inter = segmentIntersection(r1.start, r1.end, r2.start, r2.end)
					if (inter) {
						addPointToRoad(i, inter)
						addPointToRoad(j, inter)
					}
				}
			}

			// 2. Project Stairs
			if (floor.stairs) {
				for (const stair of floor.stairs) {
					let minProps = {
						dist: Infinity,
						point: null as Coordinate | null,
						roadIdx: -1,
					}
					floorRoads.forEach((road, idx) => {
						const proj = projectPointToSegment(
							stair.position,
							road.start,
							road.end,
						)
						if (proj && proj.distance < minProps.dist) {
							minProps = {
								dist: proj.distance,
								point: proj.projection,
								roadIdx: idx,
							}
						}
					})

					if (minProps.point && minProps.roadIdx !== -1) {
						addPointToRoad(minProps.roadIdx, minProps.point)
						stairProjections.push({
							id: stair.id,
							floor: floor.id,
							point: minProps.point,
						})
					}
				}
			}

			// 3. Project Start/End if on this floor
			const handlePOI = (poi: Point, type: "start" | "end") => {
				if (poi.floor !== floor.id) return

				let minProps = {
					dist: Infinity,
					point: null as Coordinate | null,
					roadIdx: -1,
				}

				floorRoads.forEach((road, idx) => {
					const proj = projectPointToSegment(poi, road.start, road.end)
					if (proj && proj.distance < minProps.dist) {
						minProps = {
							dist: proj.distance,
							point: proj.projection,
							roadIdx: idx,
						}
					}
				})

				if (!minProps.point || minProps.roadIdx === -1) return

				addPointToRoad(minProps.roadIdx, minProps.point)
				const node = getNode(floor.id, minProps.point.x, minProps.point.y)
				if (type === "start") startNode = node
				else endNode = node
			}

			handlePOI({ ...input.start }, "start")
			handlePOI({ ...input.end }, "end")

			// 4. Create nodes and horizontal edges
			pointsOnRoads.forEach((points, roadIdx) => {
				const roadStart = floorRoads[roadIdx].start
				// Sort points by distance from start of road
				const sorted = points
					.map((p) => ({
						point: p,
						dist: getDist(roadStart, p),
					}))
					.sort((a, b) => a.dist - b.dist)

				for (let i = 0; i < sorted.length - 1; i++) {
					const p1 = sorted[i]
					const p2 = sorted[i + 1]
					const d = p2.dist - p1.dist
					if (d > 1e-3) {
						const n1 = getNode(floor.id, p1.point.x, p1.point.y)
						const n2 = getNode(floor.id, p2.point.x, p2.point.y)
						addEdge(n1, n2, d, "road")
						addEdge(n2, n1, d, "road")
					}
				}
			})
		}

		// 5. Create vertical edges (Stairs)
		// Group by stair ID
		const stairsById = new Map<number, GraphNode[]>()
		stairProjections.forEach((sp) => {
			const node = getNode(sp.floor, sp.point.x, sp.point.y)
			const stairNodes = stairsById.get(sp.id)
			if (stairNodes) {
				stairNodes.push(node)
			} else {
				stairsById.set(sp.id, [node])
			}
		})

		const STAIR_WEIGHT = 500
		stairsById.forEach((nodes) => {
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const n1 = nodes[i]
					const n2 = nodes[j]
					// Connect them
					addEdge(n1, n2, STAIR_WEIGHT, "stairs", n2.floor)
					addEdge(n2, n1, STAIR_WEIGHT, "stairs", n1.floor)
				}
			}
		})

		if (!startNode || !endNode) {
			return { route: [] }
		}

		const start = startNode as GraphNode
		const end = endNode as GraphNode

		// 7. Dijkstra
		const distances = new Map<string, number>()
		const previous = new Map<string, { node: GraphNode; edge: GraphEdge }>()
		const queue: { id: string; dist: number }[] = []

		distances.set(start.id, 0)
		queue.push({ id: start.id, dist: 0 })

		let found = false
		while (queue.length > 0) {
			queue.sort((a, b) => a.dist - b.dist)
			const nextItem = queue.shift()
			if (!nextItem) break
			const { id, dist } = nextItem

			if (dist > (distances.get(id) ?? Infinity)) continue
			if (id === end.id) {
				found = true
				break
			}

			const u = nodes.get(id)
			if (!u) continue
			for (const edge of u.neighbors) {
				const alt = dist + edge.weight
				if (alt < (distances.get(edge.node.id) ?? Infinity)) {
					distances.set(edge.node.id, alt)
					previous.set(edge.node.id, { node: u, edge })
					queue.push({ id: edge.node.id, dist: alt })
				}
			}
		}

		if (!found) {
			return { route: [] }
		}

		// 8. Reconstruct path forward
		const rawPath: GraphNode[] = []
		let temp: GraphNode | null = end
		while (temp) {
			rawPath.unshift(temp)
			temp = previous.get(temp.id)?.node ?? null
		}

		const route = rawPath.map((node, i) => {
			// Find edge to next node
			if (i < rawPath.length - 1) {
				const next = rawPath[i + 1]
				// Find edge in neighbors
				const edge = node.neighbors.find((e) => e.node.id === next.id)
				if (edge?.type === "stairs") {
					return {
						floor: node.floor,
						x: node.x,
						y: node.y,
						type: "stairs" as const,
						toFloor: next.floor,
					}
				}
			}
			return {
				floor: node.floor,
				x: node.x,
				y: node.y,
				type: "road" as const,
			}
		})

		return { route }
	})
