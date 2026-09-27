import {
	type BufferGeometry,
	Color,
	CylinderGeometry,
	ExtrudeGeometry,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshBasicMaterial,
	type MeshStandardMaterial,
	Path,
	Shape,
	ShapeUtils,
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

import { levelFloors, renderLevel, renderLevelRoute } from "./campus-layout"
import { formatNavigationText } from "./format-navigation-text"
import { createIndoorFountain } from "./indoor-fountain"
import {
	entityCenter,
	floorRouteChains,
	type IndoorRoutePoint,
	roomPoints,
	roundRouteCorners,
} from "./indoor-geometry"
import { clipWallGeometry, wallFootprints } from "./indoor-wall-clipping"
import { createWallShapes } from "./indoor-walls"

export const WALL_HEIGHT = 58
const priorityLabelNames = new Set(["буфет", "столовая", "гардероб", "магазин"])
const namedMapIcons: Record<string, string> = {
	туалет: "toilet",
	столовая: "food",
	буфет: "food",
	'бистро "апельсин"': "food",
	лестница: "stairs",
	магазин: "storefront-outline-24",
}
export const INDOOR_PALETTES = {
	light: {
		slab: "#dce2e9",
		floor: "#f2f5f9",
		room: "#e6f2ff",
		wall: "#ffffff",
		wallUpper: "#deebff",
		wallBase: "#bfd3eb",
		edge: "#c8d9ec",
		accent: "#fc4c01",
	},
	dark: {
		slab: "#17212d",
		floor: "#202c3a",
		room: "#2a3d55",
		wall: "#a9c5e5",
		wallUpper: "#607fa3",
		wallBase: "#354c68",
		edge: "#4d6b8c",
		accent: "#fc4c01",
	},
}

export type IndoorLabel = {
	kind?: "campus" | "model"
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
	const palette = INDOOR_PALETTES[theme]
	const group = new Group()
	const rooms = new Map<number, Mesh<BufferGeometry, MeshBasicMaterial>>()
	const pickTargets: Mesh[] = []
	const landmarkMaterials = new Map<number, MeshBasicMaterial>()
	const labels: IndoorLabel[] = []
	const world = (p: Coordinate) => ({
		x: p.x + floor.position.x,
		y: p.y + floor.position.y,
	})
	const floorShape = shapeFor(floor.wallsPosition.map(world))
	for (const hole of floor.holes ?? []) {
		const ring = hole.map(world).map((p) => new Vector2(p.x, -p.y))
		if (ShapeUtils.isClockWise(ring)) ring.reverse()
		floorShape.holes.push(new Path(ring))
	}
	if (floor.wallsPosition.length >= 3) {
		const slab = new Mesh(extrude(floorShape, 22), [
			new MeshBasicMaterial({ color: palette.floor, toneMapped: false }),
			new MeshBasicMaterial({ color: palette.slab, toneMapped: false }),
		])
		slab.position.y = -22
		group.add(slab)
	}
	const walls: BufferGeometry[] = []
	const roomWalls: ReturnType<typeof wallFootprints> = []
	const wallRim = new Color(palette.wall)
	const wallTop = new Color(palette.wallUpper)
	const wallBase = new Color(palette.wallBase)
	const wallColor = new Color()
	const addWalls = (
		shapes: Shape[],
		height = WALL_HEIGHT,
		coveredBy: ReturnType<typeof wallFootprints> = [],
	) => {
		for (const shape of shapes) {
			const geometry = clipWallGeometry(extrude(shape, height), coveredBy)
			const positions = geometry.getAttribute("position")
			const normals = geometry.getAttribute("normal")
			const colors = new Float32BufferAttribute(positions.count * 3, 3)
			// Normalize per wall so low perimeter walls have the same gradient.
			for (let i = 0; i < positions.count; i++) {
				const progress = Math.min(1, Math.max(0, positions.getY(i) / height))
				if (normals.getY(i) > 0.5) wallColor.copy(wallRim)
				else wallColor.lerpColors(wallBase, wallTop, progress)
				colors.setXYZ(i, wallColor.r, wallColor.g, wallColor.b)
			}
			geometry.setAttribute("color", colors)
			walls.push(geometry)
		}
	}
	for (const entity of data.entities.filter((e) => e.floorId === floor.id)) {
		if (isRoom(entity)) {
			const points = roomPoints(entity, floor)
			if (points.length < 3) continue
			const material = new MeshBasicMaterial({
				color: palette.room,
				toneMapped: false,
			})
			const mesh = new Mesh(extrude(shapeFor(points), 3), material)
			mesh.userData.entityId = entity.id
			rooms.set(entity.id, mesh)
			pickTargets.push(mesh)
			group.add(mesh)
			const doors = (entity.doorsPosition ?? []).map((p) =>
				world({ x: p.x + entity.position.x, y: p.y + entity.position.y }),
			)
			const shapes = createWallShapes(points, doors)
			addWalls(shapes)
			roomWalls.push(...wallFootprints(shapes))
			if (entity.nameHidden) continue
		} else if (entity.hiddenOnMap) continue
		const name = entity.name.trim().toLocaleLowerCase("ru-RU")
		const icon =
			entity.icon ??
			namedMapIcons[name] ??
			(isRoom(entity) ? undefined : entity.placeType)
		const position = entityCenter(entity, floor)
		if (!isRoom(entity) && icon === "fountain") {
			const fountain = createIndoorFountain(theme, entity.id)
			fountain.group.position.set(position.x, 0, position.y)
			group.add(fountain.group)
			pickTargets.push(...fountain.pickTargets)
			landmarkMaterials.set(entity.id, fountain.stone)
			// A transparent semantic button keeps keyboard and touch access.
			labels.push({
				position,
				text: entity.name,
				entityId: entity.id,
				kind: "model",
				iconOnly: true,
				priority: entity.priority ?? 0,
			})
			continue
		}
		labels.push({
			position,
			text: entity.name,
			entityId: entity.id,
			icon,
			iconOnly: icon === "stairs" || /^toilet(?:-|$)/.test(icon ?? ""),
			priority: priorityLabelNames.has(name)
				? Math.max(entity.priority ?? 0, 500)
				: (entity.priority ?? 0),
		})
	}
	// Cut the full perimeter surfaces against room walls, including their corners.
	addWalls(createWallShapes(floor.wallsPosition.map(world)), 16, roomWalls)
	for (const hole of floor.holes ?? [])
		addWalls(createWallShapes(hole.map(world)), 24, roomWalls)
	if (walls.length) {
		const geometry = mergeGeometries(walls)
		for (const wall of walls) wall.dispose()
		if (geometry) {
			const mesh = new Mesh(
				geometry,
				new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
			)
			mesh.name = "indoor-walls"
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
		// Temporarily hide 3D stairs; keep the geometry code for later.
		// for (let i = 0; i < 6; i++) {
		// 	const step = new Mesh(
		// 		new BoxGeometry(40, 4 + i * 5, 7),
		// 		new MeshStandardMaterial({ color: palette.edge, roughness: 1 }),
		// 	)
		// 	step.position.set(p.x, (4 + i * 5) / 2, p.y + i * 7 - 21)
		// 	group.add(step)
		// }
	}
	return { group, rooms, pickTargets, landmarkMaterials, labels, palette }
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
		renderOrder = white ? 11 : 10,
	) => {
		const geometry = new SphereGeometry(radius, 20, 12)
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
		dot.renderOrder = renderOrder
		group.add(dot)
	}
	let distance = 0
	for (const points of floorRouteChains(route, floor)) {
		const chain = roundRouteCorners(points)
		if (chain.length) addDot(chain[0], 6, distance)
		for (let i = 1; i < chain.length; i++) {
			const a = chain[i - 1]
			const b = chain[i]
			const length = Math.hypot(b.x - a.x, b.y - a.y)
			if (length < 0.01) continue
			const geometry = new CylinderGeometry(6, 6, length, 16)
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
			addDot(position, 19, endpointDistance, true, 11)
			addDot(position, 15, endpointDistance, false, 12)
			addDot(position, 7, endpointDistance, true, 13)
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
					text: formatNavigationText(
						`Далее: ${destination.name.toLowerCase()}`,
					),
					icon: "stairs",
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
			const initialDelay = 800
			const interval = 3500
			const duration = 1400
			const cycle = Math.max(0, elapsed - initialDelay) % interval
			const visible = enabled && elapsed >= initialDelay && cycle < duration
			const progress = Math.min(cycle / 1260, 1)
			shinePosition.value = -0.5 + 2 * (0.5 - Math.cos(progress * Math.PI) / 2)
			shineOpacity.value = visible
				? Math.min(cycle / 140, 1, (duration - cycle) / 140)
				: 0
			return elapsed < initialDelay
				? initialDelay - elapsed
				: visible
					? 0
					: interval - cycle
		},
	}
}

export const highlightIndoorRoom = (
	model: ReturnType<typeof createIndoorFloor>,
	id: number | null,
) => {
	for (const [entityId, material] of model.landmarkMaterials)
		material.color.set(entityId === id ? model.palette.accent : "#ffffff")
	for (const [roomId, room] of model.rooms) {
		room.material.color.set(
			roomId === id
				? new Color(model.palette.room).lerp(
						new Color(model.palette.accent),
						0.5,
					)
				: model.palette.room,
		)
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

export const createIndoorLevel = (
	data: BuildingScheme,
	floor: Floor,
	theme: "light" | "dark",
) => {
	const parts = levelFloors(data, floor.id)
	const ids = new Set(parts.map((part) => part.id))
	const models = parts.map((part) =>
		createIndoorFloor(
			data,
			{
				...part,
				stairs: part.stairs?.filter(
					(s) => !s.floors.some((id) => ids.has(id) && id !== part.id),
				),
			},
			theme,
		),
	)
	const model = models[0]
	for (const other of models.slice(1)) {
		model.group.add(other.group)
		for (const [id, room] of other.rooms) model.rooms.set(id, room)
		model.pickTargets.push(...other.pickTargets)
		for (const [id, material] of other.landmarkMaterials)
			model.landmarkMaterials.set(id, material)
		model.labels.push(...other.labels)
	}
	for (const part of parts) {
		const xs = part.wallsPosition.map((p) => p.x + part.position.x)
		const ys = part.wallsPosition.map((p) => p.y + part.position.y)
		model.labels.push({
			position: {
				x: (Math.min(...xs) + Math.max(...xs)) / 2,
				y: Math.min(...ys) - 90,
			},
			text: /школ/i.test(part.name) ? "Школа" : "МИДИС",
			kind: "campus",
			priority: 100,
		})
	}
	return model
}
export const createIndoorLevelRoute = (
	route: IndoorRoutePoint[],
	floor: Floor,
	data: BuildingScheme,
) => {
	const level = renderLevel(data, floor.id).data
	return createIndoorRoute(
		renderLevelRoute(data, floor.id, route),
		level.floors.find((f) => f.id === floor.id) ?? floor,
		level,
	)
}
