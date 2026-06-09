import z from "zod"

import type { BuildingScheme } from "./building-scheme"

const coordinateSchema = z.object({
	x: z.number().finite(),
	y: z.number().finite(),
})

const roadSchema = z.object({
	start: coordinateSchema,
	end: coordinateSchema,
})

const stairSchema = z.object({
	id: z.number().int(),
	floors: z.array(z.number().int()).min(1),
	position: coordinateSchema,
})

const photoPointSchema = z.object({
	position: coordinateSchema,
	angle: z.number().finite(),
	url: z.string().min(1),
})

const floorSchema = z.object({
	name: z.string().min(1),
	id: z.number().int(),
	position: coordinateSchema,
	acronym: z.string().optional(),
	wallsPosition: z.array(coordinateSchema).min(3),
	roads: z.array(roadSchema).optional(),
	stairs: z.array(stairSchema).optional(),
	photoPoints: z.array(photoPointSchema).optional(),
})

const baseEntitySchema = z.object({
	id: z.number().int(),
	floorId: z.number().int(),
	name: z.string().min(1),
	priority: z.number().finite().optional(),
	aliases: z.array(z.string()).optional(),
	hiddenInSearch: z.boolean().optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	position: coordinateSchema,
})

const roomSchema = baseEntitySchema.extend({
	type: z.literal("room"),
	nameHidden: z.boolean().optional(),
	clickable: z.boolean().optional(),
	wallsPosition: z.array(coordinateSchema).min(3),
	doorsPosition: z.array(coordinateSchema).optional(),
	url: z.string().optional(),
})

const placeSchema = baseEntitySchema.extend({
	type: z.literal("place"),
	placeType: z.string().optional(),
})

export const buildingSchemeSchema: z.ZodType<BuildingScheme> = z
	.object({
		floors: z.array(floorSchema).min(1),
		entities: z.array(z.discriminatedUnion("type", [roomSchema, placeSchema])),
	})
	.superRefine((scheme, context) => {
		const floorIds = new Set<number>()
		const entityIds = new Set<number>()

		for (const floor of scheme.floors) {
			if (floorIds.has(floor.id)) {
				context.addIssue({
					code: "custom",
					message: `Повторяющийся id этажа: ${floor.id}`,
					path: ["floors"],
				})
			}
			floorIds.add(floor.id)
		}

		for (const entity of scheme.entities) {
			if (entityIds.has(entity.id)) {
				context.addIssue({
					code: "custom",
					message: `Повторяющийся id объекта: ${entity.id}`,
					path: ["entities"],
				})
			}
			entityIds.add(entity.id)

			if (!floorIds.has(entity.floorId)) {
				context.addIssue({
					code: "custom",
					message: `Объект ${entity.id} ссылается на отсутствующий этаж`,
					path: ["entities"],
				})
			}
		}

		for (const floor of scheme.floors) {
			const stairIds = new Set<number>()
			for (const stair of floor.stairs ?? []) {
				if (stairIds.has(stair.id)) {
					context.addIssue({
						code: "custom",
						message: `Повторяющийся id лестницы ${stair.id} на этаже ${floor.id}`,
						path: ["floors"],
					})
				}
				stairIds.add(stair.id)

				for (const connectedFloorId of stair.floors) {
					if (!floorIds.has(connectedFloorId)) {
						context.addIssue({
							code: "custom",
							message: `Лестница ${stair.id} ссылается на отсутствующий этаж`,
							path: ["floors"],
						})
					}
				}
			}
		}
	})
