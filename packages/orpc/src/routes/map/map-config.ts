import { ORPCError } from "@orpc/client"

import { configTable, db, eq } from "@repo/drizzle"
import type { BuildingScheme } from "@repo/shared/building-scheme"
import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

export const BUILDING_SCHEME_CONFIG_ID = "buildingScheme"
export const BUILDING_SCHEME_BACKUP_CONFIG_ID = "buildingSchemeBackup"

export type BuildingSchemeBackup = {
	scheme: BuildingScheme
	createdAt: string
	createdBy: number
}

export const getRawBuildingScheme = async () => {
	const config = await db
		.select()
		.from(configTable)
		.where(eq(configTable.id, BUILDING_SCHEME_CONFIG_ID))
		.limit(1)
		.then(([item]) => item)

	const parsed = buildingSchemeSchema.safeParse(config?.json)
	if (!parsed.success) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Рабочая карта отсутствует или повреждена",
		})
	}

	return parsed.data
}

export const getBuildingSchemeBackup = async () => {
	const config = await db
		.select()
		.from(configTable)
		.where(eq(configTable.id, BUILDING_SCHEME_BACKUP_CONFIG_ID))
		.limit(1)
		.then(([item]) => item)

	if (!config) return null

	const backup = config.json as Partial<BuildingSchemeBackup>
	const parsedScheme = buildingSchemeSchema.safeParse(backup.scheme)

	if (
		!parsedScheme.success ||
		typeof backup.createdAt !== "string" ||
		typeof backup.createdBy !== "number"
	) {
		return null
	}

	return {
		scheme: parsedScheme.data,
		createdAt: backup.createdAt,
		createdBy: backup.createdBy,
	} satisfies BuildingSchemeBackup
}
