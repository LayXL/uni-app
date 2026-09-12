import { z } from "zod"

import {
	cardSettingsSchema,
	defaultCardSettings,
} from "@repo/shared/lessons/card-settings"

export const GUEST_USER_ID = 0
export const GUEST_STORAGE_KEY = "uni-app:guest:v1"

const stateSchema = z.object({
	group: z
		.object({
			id: z.number(),
			bitrixId: z.string(),
			displayName: z.string(),
			type: z.enum(["studentsGroup", "teacher"]),
			isDeleted: z.boolean(),
		})
		.nullable()
		.default(null),
	cardSettings: cardSettingsSchema.default(defaultCardSettings),
	isEnabledNotifications: z.boolean().default(false),
	visitCount: z.number().default(0),
	lastSessionId: z.string().nullable().default(null),
	hintDismissed: z.boolean().default(false),
	feedback: z
		.object({
			id: z.number(),
			userId: z.number(),
			rating: z.number(),
			reasons: z.string().array(),
			comment: z.string(),
			group: z.number().nullable(),
			platform: z.string(),
			visitNumber: z.number(),
			sessionId: z.string(),
			source: z.string(),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date(),
		})
		.nullable()
		.default(null),
})

export type GuestState = z.infer<typeof stateSchema>

export function createGuestStorage(
	getStorage: () => Pick<Storage, "getItem" | "setItem">,
) {
	const read = (): GuestState => {
		const raw = getStorage().getItem(GUEST_STORAGE_KEY)
		if (raw === null) return stateSchema.parse({})
		// Do not overwrite unreadable data with an empty profile.
		return stateSchema.parse(JSON.parse(raw))
	}
	const update = (change: (state: GuestState) => void) => {
		const state = read()
		change(state)
		try {
			getStorage().setItem(GUEST_STORAGE_KEY, JSON.stringify(state))
		} catch {
			throw new Error(
				"Не удалось сохранить данные в браузере. Проверьте, доступно ли локальное хранилище, и попробуйте ещё раз.",
			)
		}
		return state
	}
	return { read, update }
}
