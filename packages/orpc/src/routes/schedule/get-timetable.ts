import { getConfig } from "@repo/shared/config/get-config"

import { publicProcedure } from "../../procedures/public"

export const getTimetable = publicProcedure.handler(() =>
	getConfig("timetable"),
)
