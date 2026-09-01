import type { Floor, MapEntity } from "@repo/shared/building-scheme"

const SCHOOL_LOCATION_DESCRIPTION = "Находится в школе"

export const getEntitySearchDescription = (
	entity: MapEntity,
	floors: Floor[],
) => {
	const floor = floors.find((floor) => floor.id === entity.floorId)
	const isInSchool = floor?.name.toLocaleLowerCase("ru-RU").includes("школ")

	return [
		entity.description,
		isInSchool ? SCHOOL_LOCATION_DESCRIPTION : undefined,
	]
		.filter(Boolean)
		.join(" · ")
}
