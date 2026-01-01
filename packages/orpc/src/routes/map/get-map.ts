import { getConfig } from "@repo/shared/config/get-config"

import { publicProcedure } from "../../procedures/public"

export const getMap = publicProcedure.handler(async ({ input }) => {
	const buildingScheme = await getConfig("buildingScheme")

	return buildingScheme
})
