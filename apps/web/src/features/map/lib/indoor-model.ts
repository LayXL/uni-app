import {
	BoxGeometry,
	type BufferGeometry,
	Color,
	CylinderGeometry,
	ExtrudeGeometry,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Path,
	Shape,
	SphereGeometry,
	Vector2,
} from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"

import type {
	BuildingScheme,
	Coordinate,
	Floor,
} from "@repo/shared/building-scheme"
import { isRoom } from "@repo/shared/building-scheme"

import { getFloorColor } from "./floor-colors"
import {
	entityCenter,
	floorRouteChains,
	type IndoorRoutePoint,
	roomPoints,
	wallSegments,
} from "./indoor-geometry"

export const WALL_HEIGHT = 58
const namedMapIcons: Record<string, string> = {
	туалет: "toilet",
	лестница: "stairs",
	магазин: "storefront-outline-24",
}
export const INDOOR_PALETTES = {
	light: {
		slab: "#c5cbd3",
		floor: "#eef0f3",
		room: "#dce3ea",
		wall: "#ffffff",
		edge: "#d2d9e1",
		accent: "#fc4c01",
	},
	dark: {
		slab: "#161d29",
		floor: "#242e3e",
		room: "#35445a",
		wall: "#708198",
		edge: "#52637b",
		accent: "#fc4c01",
	},
}

export type IndoorLabel = {
	position: Coordinate
	text: string
	icon?: string
	iconOnly?: boolean
	entityId?: number
	floorId?: number
	priority: number
	selected?: boolean
}

const buildingPassage = (from: Floor, to: Floor) => {
	const fromSchool = /школ/i.test(from.name)
	const toSchool = /школ/i.test(to.name)
	if (fromSchool === toSchool) return null
	return {
		text: toSchool ? "В школу" : "В МИДИС",
		icon: toSchool ? "seven" : "midis",
	}
}

const shapeFor = (points: Coordinate[]) =>
	new Shape(points.map((p) => new Vector2(p.x, -p.y)))
const extrude = (shape: Shape, depth: number) => {
	const geometry = new ExtrudeGeometry(shape, {
		depth,
		bevelEnabled: false,
		steps: 1,
		curveSegments: 1,
	})
	geometry.rotateX(-Math.PI / 2)
	return geometry
}

export const createIndoorFloor = (
	data: BuildingScheme,
	floor: Floor,
	theme: "light" | "dark",
) => {
	const palette = {
		...INDOOR_PALETTES[theme],
		floor: getFloorColor(floor, theme, INDOOR_PALETTES[theme].floor),
	}
	const group = new Group()
	const rooms = new Map<number, Mesh<BufferGeometry, MeshStandardMaterial>>()
	const labels: IndoorLabel[] = []
	const world = (p: Coordinate) => ({
		x: p.x + floor.position.x,
		y: p.y + floor.position.y,
	})
	const floorShape = shapeFor(floor.wallsPosition.map(world))
	for (const hole of floor.holes ?? [])
		floorShape.holes.push(
			new Path(hole.map(world).map((p) => new Vector2(p.x, -p.y))),
		)
	if (floor.wallsPosition.length >= 3) {
		const slab = new Mesh(extrude(floorShape, 22), [
			new MeshStandardMaterial({ color: palette.floor, roughness: 1 }),
			new MeshStandardMaterial({ color: palette.slab, roughness: 1 }),
		])
		slab.position.y = -22
		slab.receiveShadow = true
		group.add(slab)
	}
	const walls: BufferGeometry[] = []
	const addWalls = (
		points: Coordinate[],
		doors: Coordinate[] = [],
		height = WALL_HEIGHT,
	) => {
		for (const { start, end } of wallSegments(points, doors)) {
			const length = Math.hypot(end.x - start.x, end.y - start.y)
			const geometry = new BoxGeometry(length, height, 6)
			geometry.rotateY(-Math.atan2(end.y - start.y, end.x - start.x))
			geometry.translate(
				(start.x + end.x) / 2,
				height / 2,
				(start.y + end.y) / 2,
			)
			walls.push(geometry)
		}
	}
	// A low perimeter describes the building without hiding entrances or corridors.
	addWalls(floor.wallsPosition.map(world), [], 16)
	for (const hole of floor.holes ?? []) addWalls(hole.map(world), [], 24)
	for (const entity of data.entities.filter((e) => e.floorId === floor.id)) {
		if (isRoom(entity)) {
			const points = roomPoints(entity, floor)
			if (points.length < 3) continue
			const material = new MeshStandardMaterial({
				color: palette.room,
				roughness: 1,
			})
			const mesh = new Mesh(extrude(shapeFor(points), 3), material)
			mesh.userData.entityId = entity.id
			mesh.receiveShadow = true
			rooms.set(entity.id, mesh)
			group.add(mesh)
			const doors = (entity.doorsPosition ?? []).map((p) =>
				world({ x: p.x + entity.position.x, y: p.y + entity.position.y }),
			)
			addWalls(points, doors)
			if (entity.nameHidden) continue
		} else if (entity.hiddenOnMap) continue
		const name = entity.name.trim().toLocaleLowerCase("ru-RU")
		const icon =
			entity.icon ??
			namedMapIcons[name] ??
			(isRoom(entity) ? undefined : entity.placeType)
		labels.push({
			position: entityCenter(entity, floor),
			text: entity.name,
			entityId: entity.id,
			icon,
			iconOnly: icon === "stairs" || /^toilet(?:-|$)/.test(icon ?? ""),
			priority: entity.priority ?? 0,
		})
	}
	if (walls.length) {
		const geometry = mergeGeometries(walls)
		for (const wall of walls) wall.dispose()
		if (geometry) {
			const mesh = new Mesh(
				geometry,
				new MeshStandardMaterial({ color: palette.wall, roughness: 1 }),
			)
			mesh.castShadow = true
			mesh.receiveShadow = true
			group.add(mesh)
		}
	}
	for (const stair of floor.stairs ?? []) {
		const p = world(stair.position)
		const destination = data.floors.find(
			(other) =>
				stair.floors.includes(other.id) && buildingPassage(floor, other),
		)
		const passage = destination && buildingPassage(floor, destination)
		if (passage) {
			labels.push({
				position: p,
				...passage,
				floorId: destination.id,
				priority: 60,
			})
			continue
		}
		labels.push({
			position: p,
			text: "Лестница",
			icon: "stairs",
			iconOnly: true,
			priority: 50,
		})
		for (let i = 0; i < 6; i++) {
			const step = new Mesh(
				new BoxGeometry(40, 4 + i * 5, 7),
				new MeshStandardMaterial({ color: palette.edge, roughness: 1 }),
			)
			step.position.set(p.x, (4 + i * 5) / 2, p.y + i * 7 - 21)
			group.add(step)
		}
	}
	return { group, rooms, labels, palette }
}

export const createIndoorRoute = (
	route: IndoorRoutePoint[],
	floor: Floor,
	data: BuildingScheme,
) => {
	const group = new Group()
	const labels: IndoorLabel[] = []
	const material = new MeshBasicMaterial({ color: "#fc4c01", depthTest: false })
	const shinePosition = { value: -1 }
	const shineOpacity = { value: 0 }
	const routeLength = { value: 1 }
	// Interpolate distance from the start so the highlight follows every turn.
	material.onBeforeCompile = (shader) => {
		shader.uniforms.routeShinePosition = shinePosition
		shader.uniforms.routeShineOpacity = shineOpacity
		shader.uniforms.routeLength = routeLength
		shader.vertexShader = `attribute float routeDistance;
 varying float vRouteShine;
${shader.vertexShader}`
		shader.vertexShader = shader.vertexShader.replace(
			"#include <project_vertex>",
			`#include <project_vertex>
			vRouteShine = routeDistance;`,
		)
		shader.fragmentShader = `
			uniform float routeShinePosition;
			uniform float routeShineOpacity;
			uniform float routeLength;
			varying float vRouteShine;
			${shader.fragmentShader}`
		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <opaque_fragment>",
			`float routeCoordinate = vRouteShine / routeLength;
			float highlight = max(0.0, 1.0 - abs(routeCoordinate - routeShinePosition) / 0.2);
			outgoingLight = mix(outgoingLight, vec3(1.0), highlight * routeShineOpacity * 0.26);
			#include <opaque_fragment>`,
		)
	}
	const addDot = (
		p: Coordinate,
		radius: number,
		distance: number,
		white = false,
	) => {
		const geometry = new SphereGeometry(radius, 12, 8)
		geometry.setAttribute(
			"routeDistance",
			new Float32BufferAttribute(
				new Float32Array(geometry.getAttribute("position").count).fill(
					distance,
				),
				1,
			),
		)
		const dot = new Mesh(
			geometry,
			white
				? new MeshBasicMaterial({ color: "#ffffff", depthTest: false })
				: material,
		)
		dot.position.set(p.x, 12, p.y)
		dot.renderOrder = white ? 11 : 10
		group.add(dot)
	}
	let distance = 0
	for (const chain of floorRouteChains(route, floor)) {
		if (chain.length) addDot(chain[0], 6, distance)
		for (let i = 1; i < chain.length; i++) {
			const a = chain[i - 1]
			const b = chain[i]
			const length = Math.hypot(b.x - a.x, b.y - a.y)
			if (length < 0.01) continue
			const geometry = new CylinderGeometry(6, 6, length, 8)
			const positions = geometry.getAttribute("position")
			const distances = new Float32Array(positions.count)
			for (let vertex = 0; vertex < positions.count; vertex++) {
				// After rotation, local +Y is the start of the segment.
				distances[vertex] = distance + length / 2 - positions.getY(vertex)
			}
			geometry.setAttribute(
				"routeDistance",
				new Float32BufferAttribute(distances, 1),
			)
			const segment = new Mesh(geometry, material)
			segment.rotation.z = Math.PI / 2
			segment.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x)
			segment.position.set((a.x + b.x) / 2, 12, (a.y + b.y) / 2)
			segment.renderOrder = 10
			group.add(segment)
			distance += length
			addDot(b, 6, distance)
		}
	}
	for (const [index, point] of route.entries()) {
		if (point.floor !== floor.id) continue
		const position = {
			x: point.x + floor.position.x,
			y: point.y + floor.position.y,
		}
		if (index === 0 || index === route.length - 1) {
			const endpointDistance = index === 0 ? 0 : distance
			addDot(position, 15, endpointDistance)
			addDot(position, 7, endpointDistance, true)
			labels.push({
				position,
				text: index === 0 ? "Старт" : "Финиш",
				priority: 1000,
			})
		}
		if (
			point.type === "stairs" &&
			point.toFloor != null &&
			point.toFloor !== floor.id
		) {
			const destination = data.floors.find((f) => f.id === point.toFloor)
			if (destination)
				labels.push({
					position,
					...(buildingPassage(floor, destination) ?? {
						text: `Далее: ${destination.name.toLowerCase()}`,
						icon: "stairs",
					}),
					floorId: destination.id,
					priority: 1100,
				})
		}
	}
	routeLength.value = Math.max(distance, 1)
	return {
		group,
		labels,
		hasRoute: group.children.length > 0,
		updateShine: (elapsed: number, enabled: boolean) => {
			// Same 2s initial delay, 7s cycle and 20% active window as premium.css.
			const cycle = ((elapsed - 2000) % 7000) / 7000
			const visible = enabled && elapsed >= 2000 && cycle < 0.2
			const progress = Math.min(Math.max(cycle / 0.18, 0), 1)
			shinePosition.value = -0.5 + 2 * (0.5 - Math.cos(progress * Math.PI) / 2)
			shineOpacity.value = visible
				? Math.min(cycle / 0.02, 1, (0.2 - cycle) / 0.02)
				: 0
			return elapsed < 2000 ? 2000 - elapsed : visible ? 0 : (1 - cycle) * 7000
		},
	}
}

export const highlightIndoorRoom = (
	model: ReturnType<typeof createIndoorFloor>,
	id: number | null,
) => {
	for (const [roomId, room] of model.rooms) {
		room.material.color.set(
			roomId === id
				? new Color(model.palette.room).lerp(
						new Color(model.palette.accent),
						0.5,
					)
				: model.palette.room,
		)
		room.material.emissive.set(roomId === id ? model.palette.accent : "#000000")
		room.material.emissiveIntensity = roomId === id ? 0.12 : 0
	}
}

export const disposeIndoorGroup = (group: Group) => {
	const materials = new Set<MeshStandardMaterial | MeshBasicMaterial>()
	group.traverse((object) => {
		if (!(object instanceof Mesh)) return
		object.geometry.dispose()
		for (const material of Array.isArray(object.material)
			? object.material
			: [object.material])
			materials.add(material)
	})
	for (const material of materials) material.dispose()
	group.removeFromParent()
	group.clear()
}
