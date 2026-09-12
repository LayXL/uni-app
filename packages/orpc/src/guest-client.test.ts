import assert from "node:assert/strict"
import { test } from "node:test"
import { createORPCClient, ORPCError } from "@orpc/client"
import type { RouterClient } from "@orpc/server"

import { defaultCardSettings } from "@repo/shared/lessons/card-settings"

import { createGuestClient } from "./guest-client"
import {
	createGuestStorage,
	GUEST_STORAGE_KEY,
	GUEST_USER_ID,
} from "./guest-storage"
import type { router } from "./router"

const group = {
	id: 123,
	bitrixId: "123",
	displayName: "Т-123",
	type: "studentsGroup",
	isDeleted: false,
}

async function setup({ httpOnlySession = false } = {}) {
	const data = new Map<string, string>()
	const storage = {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value)
		},
	}
	let session: string | null = ""
	let failure: Error | undefined
	const calls: string[] = []
	const remote: RouterClient<typeof router> = createORPCClient({
		call: async (path) => {
			const name = path.join(".")
			calls.push(name)
			if (failure) throw failure
			if (name === "groups.getGroup") return group
			if (name === "users.me") {
				if (!session && !httpOnlySession) throw new ORPCError("UNAUTHORIZED")
				return {
					id: 42,
					group: null,
					telegramId: 42,
					isEnabledNotifications: true,
				}
			}
			if (name === "users.getCardSettings") return defaultCardSettings
			if (name.startsWith("homeworks.") || name === "users.resetHints")
				throw new ORPCError("UNAUTHORIZED")
			return { success: true }
		},
	})
	const environment = { getSession: () => session, getStorage: () => storage }
	const reload = async () => {
		const client = createGuestClient(remote, environment)
		await client.users.me()
		return client
	}
	const client = await reload()
	calls.length = 0
	return {
		client,
		reload,
		calls,
		data,
		storage,
		setSession: (value: string | null) => {
			session = value
		},
		fail: (error?: Error) => {
			failure = error
		},
	}
}

test("guest group and merged card settings survive a fresh client without private RPC calls", async () => {
	const { client, reload, calls } = await setup()
	assert.equal((await client.users.me()).id, GUEST_USER_ID)
	assert.equal((await client.users.me()).group, null)
	await client.users.updateUserGroup({ groupId: group.id })
	await client.users.updateCardSettings({ mergeCards: false })
	await client.users.updateCardSettings({ viewMode: "day" })
	const restored = await reload()
	assert.deepEqual((await restored.users.me()).group, group)
	assert.deepEqual(await restored.users.getCardSettings(), {
		...defaultCardSettings,
		mergeCards: false,
		viewMode: "day",
	})
	assert.deepEqual(
		calls.filter((name) => name !== "users.me"),
		["groups.getGroup"],
	)
	await restored.users.updateUserGroup({ groupId: null })
	assert.equal((await (await reload()).users.me()).group, null)
})

test("visits are deduplicated and hint dismissal and feedback persist locally", async () => {
	const { client, reload, calls, storage } = await setup()
	const sessionId = "test-session-0001"
	assert.equal(
		(await client.feedback.registerVisit({ sessionId })).visitCount,
		1,
	)
	assert.equal(
		(await (await reload()).feedback.registerVisit({ sessionId })).visitCount,
		1,
	)
	assert.equal((await client.users.getHints()).showScheduleSettings, false)
	await client.feedback.registerVisit({ sessionId: "test-session-0002" })
	assert.equal((await client.users.getHints()).showScheduleSettings, true)
	await client.users.dismissScheduleSettingsHint()
	assert.equal(
		(await (await reload()).users.getHints()).showScheduleSettings,
		false,
	)
	await client.feedback.submitFeedback({
		sessionId: "test-session-0002",
		rating: 5,
		reasons: [],
		comment: "Хорошо",
	})
	const feedback = createGuestStorage(() => storage).read().feedback
	assert.equal(feedback?.comment, "Хорошо")
	assert.ok(feedback?.createdAt instanceof Date)
	assert.deepEqual(
		calls.filter((name) => name !== "users.me"),
		[],
	)
})

test("authenticated sessions use RPC and leave guest data intact", async () => {
	const { client, setSession, calls, data } = await setup()
	await client.users.updateCardSettings({ viewMode: "day" })
	const saved = data.get(GUEST_STORAGE_KEY)
	setSession("session=valid")
	assert.equal((await client.users.me()).id, 42)
	assert.deepEqual(await client.users.getCardSettings(), defaultCardSettings)
	await client.users.updateUserGroup({ groupId: 123 })
	assert.deepEqual(calls, [
		"users.me",
		"users.getCardSettings",
		"users.updateUserGroup",
	])
	assert.equal(data.get(GUEST_STORAGE_KEY), saved)
	setSession("")
	await client.users.me()
	assert.equal((await client.users.getCardSettings()).viewMode, "day")
})

test("only unauthorized browser sessions fall back, and a new session is checked again", async () => {
	const { client, fail, setSession } = await setup()
	setSession("session=expired")
	fail(new ORPCError("UNAUTHORIZED"))
	assert.equal((await client.users.me()).id, GUEST_USER_ID)
	await client.users.updateCardSettings({ viewMode: "day" })
	setSession("session=fresh")
	fail()
	assert.equal((await client.users.me()).id, 42)
	fail(new ORPCError("INTERNAL_SERVER_ERROR"))
	await assert.rejects(client.users.me(), { code: "INTERNAL_SERVER_ERROR" })
	setSession(null)
	fail(new ORPCError("UNAUTHORIZED"))
	await assert.rejects(client.users.me(), { code: "UNAUTHORIZED" })
})

test("guest mode does not replace protected homework or admin endpoints", async () => {
	const { client } = await setup()
	await assert.rejects(client.homeworks.getHomeworks(), {
		code: "UNAUTHORIZED",
	})
	await assert.rejects(client.users.resetHints(), { code: "UNAUTHORIZED" })
})

test("failed or invalid writes preserve previously saved guest settings", async () => {
	const { client, data, storage } = await setup()
	await client.users.updateCardSettings({ viewMode: "day" })
	const saved = data.get(GUEST_STORAGE_KEY)
	storage.setItem = () => {
		throw new Error("QuotaExceededError")
	}
	await assert.rejects(
		client.users.updateCardSettings({ mergeCards: false }),
		/Не удалось сохранить/,
	)
	assert.equal(data.get(GUEST_STORAGE_KEY), saved)
	assert.equal((await client.users.getCardSettings()).mergeCards, true)
	data.set(GUEST_STORAGE_KEY, "broken json")
	await assert.rejects(client.users.updateCardSettings({ mergeCards: false }))
	assert.equal(data.get(GUEST_STORAGE_KEY), "broken json")
})

test("HttpOnly sessions are authenticated even when no cookie is visible to JavaScript", async () => {
	const { client, data } = await setup({ httpOnlySession: true })
	assert.equal((await client.users.me()).id, 42)
	await client.users.updateCardSettings({ viewMode: "day" })
	assert.equal(data.has(GUEST_STORAGE_KEY), false)
})
