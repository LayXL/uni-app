import { isRoom, type MapEntity, type Room } from "../building-scheme"

type ClassroomMapping = {
	aliases: string[]
	displayName: string
	roomName: string
	floorId?: number
}

const assemblyHall: ClassroomMapping = {
	aliases: [
		"305Aкт",
		"305Акт",
		"акт.зал",
		"акт. зал",
		"акт зал",
		"акт. зал.",
		"305 Акт",
		"305Акт.",
	],
	displayName: "Актовый зал",
	roomName: "Актовый зал",
}

const classroomMappings: ClassroomMapping[] = [
	assemblyHall,
	{ aliases: ["122 А"], displayName: "122А", roomName: "122А" },
	{ aliases: ["122 Б"], displayName: "122Б", roomName: "122Б" },
	{ aliases: ["122 биб."], displayName: "122", roomName: "122" },
	{ aliases: ["315А", "315а"], displayName: "315а", roomName: "315а" },
	{
		aliases: ["124 шк"],
		displayName: "124 шк",
		roomName: "124",
		floorId: 4,
	},
	{
		aliases: ["125тр.зал"],
		displayName: "125тр.зал",
		roomName: "125",
		floorId: 4,
	},
	{
		aliases: ["127 шк"],
		displayName: "127 шк",
		roomName: "127",
		floorId: 4,
	},
]

const normalizeKey = (classroom: string) =>
	classroom.trim().toLocaleLowerCase("ru-RU").replaceAll(/\s+/g, " ")

const classroomMappingsByAlias = new Map(
	classroomMappings.flatMap((mapping) =>
		mapping.aliases.map((alias) => [normalizeKey(alias), mapping] as const),
	),
)

const stripSubgroupSuffix = (classroom: string) => {
	const match = classroom.match(/^\s*(\d{3}(?:\s*[а-яё])?)\s+\(\d+\)\s*$/iu)

	return match?.[1] ?? classroom
}

const getClassroomMapping = (classroom: string) => {
	const withoutSubgroup = stripSubgroupSuffix(classroom)
	const key = normalizeKey(withoutSubgroup)
	const isAssemblyHall =
		/^(?:акт\.?\s*зал\.?|305\s*[аa]кт\.?|актовый зал)(?:\s*\(\d+\))?$/u.test(key)
	const mapping = isAssemblyHall
		? assemblyHall
		: classroomMappingsByAlias.get(key)

	return {
		displayName: mapping?.displayName ?? withoutSubgroup,
		roomName: mapping?.roomName ?? withoutSubgroup,
		floorId: mapping?.floorId,
	}
}

export const normalizeClassroomName = (classroom: string) =>
	getClassroomMapping(classroom).displayName

const findRoomByClassroomName = (
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

export const mapClassroom = (entities: MapEntity[], classroom: string) => {
	const room = findRoomByClassroomName(entities, classroom)

	if (!room) {
		return { classroom: normalizeClassroomName(classroom) }
	}

	return { classroom: room.name, classroomId: room.id }
}

export const getClassroomNamesForRoom = (
	entities: MapEntity[],
	roomId: number,
) => {
	const room = entities.find(
		(entity): entity is Room => entity.id === roomId && isRoom(entity),
	)
	if (!room) return []

	const aliases = classroomMappings
		.filter(
			(mapping) =>
				normalizeKey(mapping.roomName) === normalizeKey(room.name) &&
				(mapping.floorId === undefined || mapping.floorId === room.floorId),
		)
		.flatMap((mapping) => mapping.aliases)

	const roomsWithSameName = entities.filter(
		(entity) =>
			isRoom(entity) && normalizeKey(entity.name) === normalizeKey(room.name),
	)
	const names =
		roomsWithSameName.length > 1 && aliases.length > 0
			? aliases
			: [room.name, ...aliases]

	return [...new Set(names)]
}
