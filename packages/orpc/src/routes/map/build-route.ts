import z from "zod"

import { getConfig } from "@repo/shared/config/get-config"

import { publicProcedure } from "../../procedures/public"
import { buildRoadsToRoomDoors } from "./utils/build-roads-to-room-doors"

export const buildRoute = publicProcedure
	.input(
		z.object({
			start: z.object({
				floor: z.number(),
				x: z.number(),
				y: z.number(),
			}),
			end: z.object({
				floor: z.number(),
				x: z.number(),
				y: z.number(),
			}),
		}),
	)
	.output(
		z.object({
			route: z.array(
				z.object({
					floor: z.number(),
					x: z.number(),
					y: z.number(),
					type: z.enum(["road", "stairs"]).default("road"),
					toFloor: z.number().optional(),
				}),
			),
		}),
	)
	.handler(async () => {
		const buildingScheme = buildRoadsToRoomDoors(
			await getConfig("buildingScheme"),
		)
	})
