import { getConfig } from "@repo/shared/config/get-config"

import { publicProcedure } from "../../procedures/public"
import { buildRoadsToRoomDoors } from "./utils/build-roads-to-room-doors"

export const getMap = publicProcedure.handler(async () => {
	const buildingScheme = await getConfig("buildingScheme")

	return buildRoadsToRoomDoors(buildingScheme)
})
