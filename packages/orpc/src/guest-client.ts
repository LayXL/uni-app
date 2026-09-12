import { ORPCError } from "@orpc/client"
import type { RouterClient } from "@orpc/server"

import { cardSettingsSchema } from "@repo/shared/lessons/card-settings"
import { shouldShowScheduleSettingsHint } from "@repo/shared/lessons/schedule-settings-hint"
import { shouldShowUserFeedbackPrompt } from "@repo/shared/user-feedback"

import { createGuestStorage, GUEST_USER_ID } from "./guest-storage"
import type { router } from "./router"

type AppClient = RouterClient<typeof router>

type GuestEnvironment = {
	getSession: () => string | null
	getStorage: () => Pick<Storage, "getItem" | "setItem">
}

export function createGuestClient(
	remote: AppClient,
	environment: GuestEnvironment = {
		getSession: () =>
			typeof document === "undefined"
				? null
				: (document.cookie
						.split(";")
						.map((value) => value.trim())
						.find((value) => value.startsWith("session=")) ?? ""),
		getStorage: () => window.localStorage,
	},
): AppClient {
	const storage = createGuestStorage(environment.getStorage)
	let rejectedSession: string | undefined
	const isGuest = () => {
		const session = environment.getSession()
		return session !== null && session === rejectedSession
	}
	const localUser = () => {
		const state = storage.read()
		return {
			id: GUEST_USER_ID,
			telegramId: null,
			isAdmin: undefined,
			group: state.group,
			isEnabledNotifications: state.isEnabledNotifications,
		}
	}
	const localize = <T extends (...args: never[]) => Promise<unknown>>(
		server: T,
		local: T,
	): T =>
		new Proxy(server, {
			apply(target, thisArg, args) {
				return Reflect.apply(isGuest() ? local : target, thisArg, args)
			},
		})

	return {
		groups: remote.groups,
		schedule: remote.schedule,
		events: remote.events,
		map: remote.map,
		system: remote.system,
		users: {
			me: async (...args) => {
				// VK sessions use HttpOnly cookies, so only the server can confirm them.
				try {
					const user = await remote.users.me(...args)
					rejectedSession = undefined
					return user
				} catch (error) {
					const session = environment.getSession()
					if (
						session === null ||
						!(error instanceof ORPCError) ||
						error.code !== "UNAUTHORIZED"
					)
						throw error
					rejectedSession = session
					return localUser()
				}
			},
			updateUserGroup: localize(
				remote.users.updateUserGroup,
				async ({ groupId }) => {
					const group =
						groupId === null
							? null
							: await remote.groups.getGroup({ id: groupId })
					storage.update((state) => {
						state.group = group
					})
					return { success: true }
				},
			),
			getCardSettings: localize(
				remote.users.getCardSettings,
				async () => storage.read().cardSettings,
			),
			updateCardSettings: localize(
				remote.users.updateCardSettings,
				async (patch) => {
					return storage.update((state) => {
						state.cardSettings = cardSettingsSchema.parse({
							...state.cardSettings,
							...patch,
						})
					}).cardSettings
				},
			),
			updateNotifications: localize(
				remote.users.updateNotifications,
				async ({ enabled }) => {
					storage.update((state) => {
						state.isEnabledNotifications = enabled
					})
					return { isEnabledNotifications: enabled }
				},
			),
			getHints: localize(remote.users.getHints, async () => {
				const state = storage.read()
				return {
					showScheduleSettings: shouldShowScheduleSettingsHint({
						visitCount: state.visitCount,
						dismissed: state.hintDismissed,
						forced: false,
					}),
				}
			}),
			dismissScheduleSettingsHint: localize(
				remote.users.dismissScheduleSettingsHint,
				async () => {
					storage.update((state) => {
						state.hintDismissed = true
					})
					return { showScheduleSettings: false }
				},
			),
			resetHints: remote.users.resetHints,
		},
		feedback: {
			registerVisit: localize(
				remote.feedback.registerVisit,
				async ({ sessionId }) => {
					const { visitCount } = storage.update((state) => {
						if (state.lastSessionId !== sessionId) {
							state.visitCount++
							state.lastSessionId = sessionId
						}
					})
					return {
						visitCount,
						shouldShow: shouldShowUserFeedbackPrompt({ visitCount }),
					}
				},
			),
			submitFeedback: localize(
				remote.feedback.submitFeedback,
				async (input) => {
					const state = storage.read()
					if (input.sessionId !== state.lastSessionId)
						throw new ORPCError("FORBIDDEN")
					const feedback = {
						...input,
						comment: input.comment ?? "",
						id: 0,
						userId: GUEST_USER_ID,
						group: state.group?.id ?? null,
						platform: "guest",
						visitNumber: state.visitCount,
						source: "schedule",
						createdAt: state.feedback?.createdAt ?? new Date(),
						updatedAt: new Date(),
					}
					storage.update((current) => {
						current.feedback = feedback
					})
					return feedback
				},
			),
		},
		homeworks: remote.homeworks,
	}
}
