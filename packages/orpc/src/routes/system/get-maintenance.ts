import { publicProcedure } from "../../procedures/public"
import { getMaintenanceConfig } from "./maintenance-config"

export const getMaintenance = publicProcedure.handler(() =>
	getMaintenanceConfig(),
)
