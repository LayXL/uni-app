import { ORPCError } from "@orpc/client"

import { privateProcedure } from "../../procedures/private"
import { getBuildingSchemeBackup, getRawBuildingScheme } from "./map-config"

export const getEditorState = privateProcedure.handler(async ({ context }) => {
	if (!context.user.isAdmin) {
		throw new ORPCError("FORBIDDEN")
	}

	const [scheme, backup] = await Promise.all([
		getRawBuildingScheme(),
		getBuildingSchemeBackup(),
	])

	return {
		scheme,
		backup: backup
			? {
					createdAt: backup.createdAt,
					createdBy: backup.createdBy,
				}
			: null,
	}
})
