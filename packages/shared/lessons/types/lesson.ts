import z from "zod"

export const lessonSchema = z.object({
	date: z.string(),
	order: z.number(),
	classroom: z.string(),
	isCancelled: z.boolean(),
	isDistance: z.boolean(),
	isChanged: z.boolean(),
	original: z.unknown().nullable(),
	subject: z.object({
		id: z.number(),
		name: z.string(),
	}),
	groups: z.array(
		z.object({
			id: z.number(),
			displayName: z.string(),
			type: z.enum(["studentsGroup", "teacher"]),
		}),
	),
	startTime: z.string(),
	endTime: z.string(),
})

export type Lesson = z.infer<typeof lessonSchema>
