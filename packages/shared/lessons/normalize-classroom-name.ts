import { isRoom, type MapEntity, type Room } from "../building-scheme"

type ClassroomMapping = {
	displayName: string
	roomName: string
	floorId?: number
}

const assemblyHall: ClassroomMapping = {
	displayName: "Актовый зал",
	roomName: "Актовый зал",
}

const classroomMappings = new Map<string, ClassroomMapping>([
	["305aкт", assemblyHall],
	["305акт", assemblyHall],
	["122 а", { displayName: "122А", roomName: "122А" }],
	["122 б", { displayName: "122Б", roomName: "122Б" }],
	["122 биб.", { displayName: "122", roomName: "122" }],
	["315а", { displayName: "315а", roomName: "315а" }],
	["124 шк", { displayName: "124 шк", roomName: "124", floorId: 4 }],
	["125тр.зал", { displayName: "125тр.зал", roomName: "125", floorId: 4 }],
	["127 шк", { displayName: "127 шк", roomName: "127", floorId: 4 }],
])

const normalizeKey = (classroom: string) =>
	classroom.trim().toLocaleLowerCase("ru-RU").replaceAll(/\s+/g, " ")

const stripSubgroupSuffix = (classroom: string) => {
	const match = classroom.match(/^\s*(\d{3}(?:\s*[а-яё])?)\s+\(\d+\)\s*$/iu)

	return match?.[1] ?? classroom
}

const getClassroomMapping = (classroom: string) => {
	const withoutSubgroup = stripSubgroupSuffix(classroom)
	const mapping = classroomMappings.get(normalizeKey(withoutSubgroup))

	return {
		displayName: mapping?.displayName ?? withoutSubgroup,
		roomName: mapping?.roomName ?? withoutSubgroup,
		floorId: mapping?.floorId,
	}
}

export const normalizeClassroomName = (classroom: string) =>
	getClassroomMapping(classroom).displayName

export const findRoomByClassroomName = (
	entities: MapEntity[],
	classroom: string,
): Room | undefined => {
	const mapping = getClassroomMapping(classroom)

	return entities.find(
		(entity): entity is Room =>
			isRoom(entity) &&
			normalizeKey(entity.name) === normalizeKey(mapping.roomName) &&
			(mapping.floorId === undefined || entity.floorId === mapping.floorId),
	)
}
