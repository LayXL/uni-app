import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

// Old types (v2 format)
type Coordinate = {
	x: number
	y: number
}

type Road = {
	start: Coordinate
	end: Coordinate
}

type DoorPosition = Coordinate

type WallsPolygon = Coordinate[]

type OldRoom = {
	id: number
	floorId: number
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	nameHidden?: boolean
	clickable?: boolean
	wallsPosition: WallsPolygon
	doorsPosition?: DoorPosition[]
	url?: string
}

type OldPlace = {
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	type?: string
}

type Stair = {
	id: number
	floors: number[]
	position: Coordinate
}

type PhotoPoint = {
	position: Coordinate
	angle: number
	url: string
}

type OldFloor = {
	name: string
	id: number
	position: Coordinate
	acronym?: string
	wallsPosition: WallsPolygon
	roads?: Road[]
	stairs?: Stair[]
	places?: OldPlace[]
	photoPoints?: PhotoPoint[]
}

type OldBuildingScheme = {
	floors: OldFloor[]
	rooms: OldRoom[]
}

// New types (v3 format)
type NewRoom = {
	type: "room"
	id: number
	floorId: number
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	nameHidden?: boolean
	clickable?: boolean
	wallsPosition: WallsPolygon
	doorsPosition?: DoorPosition[]
	url?: string
}

type NewPlace = {
	type: "place"
	id: number
	floorId: number
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	placeType?: string
}

type NewEntity = NewRoom | NewPlace

type NewFloor = {
	name: string
	id: number
	position: Coordinate
	acronym?: string
	wallsPosition: WallsPolygon
	roads?: Road[]
	stairs?: Stair[]
	photoPoints?: PhotoPoint[]
}

type NewBuildingScheme = {
	floors: NewFloor[]
	entities: NewEntity[]
}

function convertToV3(oldScheme: OldBuildingScheme): NewBuildingScheme {
	const entities: NewEntity[] = []

	// Find max existing id to continue from
	let nextId = 0
	for (const room of oldScheme.rooms) {
		if (room.id >= nextId) {
			nextId = room.id + 1
		}
	}

	// Convert rooms to entities with type: "room"
	for (const room of oldScheme.rooms) {
		const newRoom: NewRoom = {
			type: "room",
			id: room.id,
			floorId: room.floorId,
			name: room.name,
			position: room.position,
			wallsPosition: room.wallsPosition,
			...(room.priority !== undefined && { priority: room.priority }),
			...(room.aliases && { aliases: room.aliases }),
			...(room.hiddenInSearch !== undefined && {
				hiddenInSearch: room.hiddenInSearch,
			}),
			...(room.description && { description: room.description }),
			...(room.icon && { icon: room.icon }),
			...(room.nameHidden !== undefined && { nameHidden: room.nameHidden }),
			...(room.clickable !== undefined && { clickable: room.clickable }),
			...(room.doorsPosition && { doorsPosition: room.doorsPosition }),
			...(room.url && { url: room.url }),
		}
		entities.push(newRoom)
	}

	// Convert places from floors to entities with type: "place"
	const newFloors: NewFloor[] = []

	for (const floor of oldScheme.floors) {
		// Extract places and convert them
		if (floor.places) {
			for (const place of floor.places) {
				const newPlace: NewPlace = {
					type: "place",
					id: nextId++,
					floorId: floor.id,
					name: place.name,
					position: place.position,
					...(place.priority !== undefined && { priority: place.priority }),
					...(place.aliases && { aliases: place.aliases }),
					...(place.hiddenInSearch !== undefined && {
						hiddenInSearch: place.hiddenInSearch,
					}),
					...(place.description && { description: place.description }),
					...(place.icon && { icon: place.icon }),
					...(place.type && { placeType: place.type }),
				}
				entities.push(newPlace)
			}
		}

		// Create floor without places
		const { places: _, ...floorWithoutPlaces } = floor
		newFloors.push(floorWithoutPlaces)
	}

	return {
		floors: newFloors,
		entities,
	}
}

// Main script
const oldPath = resolve(import.meta.dirname, "new.json") // v2 format
const newPath = resolve(import.meta.dirname, "v3.json")

console.log(`Reading from: ${oldPath}`)
const oldData = JSON.parse(readFileSync(oldPath, "utf-8")) as OldBuildingScheme

console.log(`Found ${oldData.floors.length} floors and ${oldData.rooms.length} rooms`)

const newData = convertToV3(oldData)

const roomCount = newData.entities.filter((e) => e.type === "room").length
const placeCount = newData.entities.filter((e) => e.type === "place").length

console.log(
	`Converted to ${newData.floors.length} floors and ${newData.entities.length} entities (${roomCount} rooms, ${placeCount} places)`,
)

writeFileSync(newPath, JSON.stringify(newData, null, 2))
console.log(`Written to: ${newPath}`)

