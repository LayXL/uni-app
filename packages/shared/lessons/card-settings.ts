import { z } from "zod"

export const cardSettingsSchema = z.object({
	showFullTeacherName: z.boolean(),
	showParallelGroups: z.boolean(),
	mergeCards: z.boolean(),
	viewMode: z.enum(["list", "day"]),
})

export type CardSettings = z.infer<typeof cardSettingsSchema>

export const defaultCardSettings: CardSettings = {
	showFullTeacherName: false,
	showParallelGroups: true,
	mergeCards: true,
	viewMode: "list",
}
