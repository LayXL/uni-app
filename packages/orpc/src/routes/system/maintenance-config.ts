import { z } from "zod"

import { configTable, db, eq } from "@repo/drizzle"

export const MAINTENANCE_CONFIG_ID = "maintenanceMode"

export const maintenanceConfigSchema = z.object({
	enabled: z.boolean(),
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().min(1).max(500),
})

export type MaintenanceConfig = z.infer<typeof maintenanceConfigSchema>

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
	enabled: false,
	title: "Технические шоколадки",
	description: "Мы немного наводим порядок. Совсем скоро всё снова заработает.",
}

export const getMaintenanceConfig = async (): Promise<MaintenanceConfig> => {
	const config = await db
		.select({ json: configTable.json })
		.from(configTable)
		.where(eq(configTable.id, MAINTENANCE_CONFIG_ID))
		.limit(1)
		.then(([item]) => item)

	const parsed = maintenanceConfigSchema.safeParse(config?.json)

	return parsed.success ? parsed.data : DEFAULT_MAINTENANCE_CONFIG
}
