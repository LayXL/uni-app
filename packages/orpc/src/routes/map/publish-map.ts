import { ORPCError } from "@orpc/client"

import { configTable, db, eq } from "@repo/drizzle"
import { buildingSchemeSchema } from "@repo/shared/building-scheme-schema"

import { privateProcedure } from "../../procedures/private"
import {
	BUILDING_SCHEME_BACKUP_CONFIG_ID,
	BUILDING_SCHEME_CONFIG_ID,
} from "./map-config"

export const publishMap = privateProcedure
	.input(buildingSchemeSchema)
	.handler(async ({ input, context }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		const publishedAt = new Date().toISOString()

		await db.transaction(async (tx) => {
			const current = await tx
				.select()
				.from(configTable)
				.where(eq(configTable.id, BUILDING_SCHEME_CONFIG_ID))
				.limit(1)
				.for("update")
				.then(([item]) => item)

			const parsedCurrent = buildingSchemeSchema.safeParse(current?.json)
			if (!parsedCurrent.success) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Невозможно создать резервную копию рабочей карты",
				})
			}

			await tx
				.insert(configTable)
				.values({
					id: BUILDING_SCHEME_BACKUP_CONFIG_ID,
					json: {
						scheme: parsedCurrent.data,
						createdAt: publishedAt,
						createdBy: context.user.id,
					},
				})
				.onConflictDoUpdate({
					target: configTable.id,
					set: {
						json: {
							scheme: parsedCurrent.data,
							createdAt: publishedAt,
							createdBy: context.user.id,
						},
					},
				})

			await tx
				.update(configTable)
				.set({ json: input })
				.where(eq(configTable.id, BUILDING_SCHEME_CONFIG_ID))
		})

		return { publishedAt }
	})
