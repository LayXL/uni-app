import { ORPCError } from "@orpc/client"

import { configTable, db, eq } from "@repo/drizzle"
import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

import { privateProcedure } from "../../procedures/private"
import {
	BUILDING_SCHEME_BACKUP_CONFIG_ID,
	BUILDING_SCHEME_CONFIG_ID,
	type BuildingSchemeBackup,
} from "./map-config"

export const restoreMap = privateProcedure.handler(async ({ context }) => {
	if (!context.user.isAdmin) {
		throw new ORPCError("FORBIDDEN")
	}

	const restoredAt = new Date().toISOString()

	return db.transaction(async (tx) => {
		const current = await tx
			.select()
			.from(configTable)
			.where(eq(configTable.id, BUILDING_SCHEME_CONFIG_ID))
			.limit(1)
			.for("update")
			.then(([item]) => item)
		const backupConfig = await tx
			.select()
			.from(configTable)
			.where(eq(configTable.id, BUILDING_SCHEME_BACKUP_CONFIG_ID))
			.limit(1)
			.for("update")
			.then(([item]) => item)

		const parsedCurrent = buildingSchemeSchema.safeParse(current?.json)
		const backup = backupConfig?.json as
			| Partial<BuildingSchemeBackup>
			| undefined
		const parsedBackup = buildingSchemeSchema.safeParse(backup?.scheme)

		if (!parsedCurrent.success || !parsedBackup.success) {
			throw new ORPCError("NOT_FOUND", {
				message: "Корректная резервная копия карты не найдена",
			})
		}

		await tx
			.update(configTable)
			.set({ json: parsedBackup.data })
			.where(eq(configTable.id, BUILDING_SCHEME_CONFIG_ID))

		await tx
			.update(configTable)
			.set({
				json: {
					scheme: parsedCurrent.data,
					createdAt: restoredAt,
					createdBy: context.user.id,
				},
			})
			.where(eq(configTable.id, BUILDING_SCHEME_BACKUP_CONFIG_ID))

		return {
			scheme: parsedBackup.data,
			restoredAt,
		}
	})
})
