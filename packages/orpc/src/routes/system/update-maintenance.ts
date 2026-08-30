import { ORPCError } from "@orpc/client"

import { configTable, db } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"
import {
	MAINTENANCE_CONFIG_ID,
	maintenanceConfigSchema,
} from "./maintenance-config"

export const updateMaintenance = privateProcedure
	.input(maintenanceConfigSchema)
	.handler(async ({ context, input }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		await db
			.insert(configTable)
			.values({ id: MAINTENANCE_CONFIG_ID, json: input })
			.onConflictDoUpdate({
				target: configTable.id,
				set: { json: input },
			})

		return input
	})
