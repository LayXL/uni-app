import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

// Old types (before migration)
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
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	id?: number
	nameHidden?: boolean
	clickable?: boolean
	wallsPosition: WallsPolygon
	doorsPosition?: DoorPosition[]
	floorIndex?: number
	url?: string
}

type Stair = {
	id: number
	floors: number[]
	position: Coordinate
}

type Place = {
	name: string
	priority?: number
	aliases?: string[]
	hiddenInSearch?: boolean
	description?: string
	icon?: string
	position: Coordinate
	type?: string
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
	rooms?: OldRoom[]
	stairs?: Stair[]
	places?: Place[]
	photoPoints?: PhotoPoint[]
}

type OldBuildingScheme = OldFloor[]

// New types (after migration)
type NewRoom = {
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

type NewFloor = {
	name: string
	id: number
	position: Coordinate
	acronym?: string
	wallsPosition: WallsPolygon
	roads?: Road[]
	stairs?: Stair[]
	places?: Place[]
	photoPoints?: PhotoPoint[]
}

type NewBuildingScheme = {
	floors: NewFloor[]
	rooms: NewRoom[]
}

function convertToV2(oldScheme: OldBuildingScheme): NewBuildingScheme {
	const newFloors: NewFloor[] = []
	const newRooms: NewRoom[] = []

	let nextRoomId = 0

	// Find the max existing room id to start generating new ids from there
	for (const floor of oldScheme) {
		for (const room of floor.rooms ?? []) {
			if (room.id !== undefined && room.id >= nextRoomId) {
				nextRoomId = room.id + 1
			}
		}
	}

	for (const oldFloor of oldScheme) {
		// Extract floor without rooms
		const { rooms: _, ...floorWithoutRooms } = oldFloor
		newFloors.push(floorWithoutRooms)

		// Convert rooms
		for (const oldRoom of oldFloor.rooms ?? []) {
			const { floorIndex: _, id: existingId, ...roomWithoutFloorIndex } = oldRoom

			const roomId = existingId ?? nextRoomId++

			const newRoom: NewRoom = {
				...roomWithoutFloorIndex,
				id: roomId,
				floorId: oldFloor.id,
			}

			newRooms.push(newRoom)
		}
	}

	return {
		floors: newFloors,
		rooms: newRooms,
	}
}

// Main script
const oldPath = resolve(import.meta.dirname, "old.json")
const newPath = resolve(import.meta.dirname, "new.json")

console.log(`Reading from: ${oldPath}`)
const oldData = JSON.parse(readFileSync(oldPath, "utf-8")) as OldBuildingScheme

console.log(`Found ${oldData.length} floors`)

const newData = convertToV2(oldData)

console.log(`Converted to ${newData.floors.length} floors and ${newData.rooms.length} rooms`)

writeFileSync(newPath, JSON.stringify(newData, null, 2))
console.log(`Written to: ${newPath}`)

