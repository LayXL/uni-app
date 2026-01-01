import { configTable, db, eq } from "@repo/drizzle"

import type { BuildingScheme } from "../building-scheme"
import type { Timetable } from "../timetable"

type CONFIG_KEY_TO_TYPE = {
	timetable: Timetable
	buildingScheme: BuildingScheme
}

export const getConfig = async <T extends keyof CONFIG_KEY_TO_TYPE>(
	id: T,
): Promise<CONFIG_KEY_TO_TYPE[T]> => {
	const config = await db
		.select()
		.from(configTable)
		.where(eq(configTable.id, id))
		.limit(1)
		.then(([config]) => config.json)

	if (!config) {
		throw new Error(`Config ${id} not found`)
	}

	return config as CONFIG_KEY_TO_TYPE[T]
}
