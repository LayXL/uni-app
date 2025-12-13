import * as crypto from "node:crypto"
import { ORPCError } from "@orpc/client"

import { db, eq, usersTable } from "@repo/drizzle"
import { env } from "@repo/env"

import { base } from "../base"

export const authMiddleware = base.middleware(async ({ context, next }) => {
	const bearer = context.headers?.get("authorization")?.slice(7)
	const verifiedData = verifyVKInitData(bearer)

	if (!verifiedData) throw new ORPCError("UNAUTHORIZED")

	const vkId = Number(verifiedData.vk_user_id)

	let users = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.vkId, vkId))
		.limit(1)

	if (users.length === 0) {
		users = await db.insert(usersTable).values({ vkId }).returning()
	}

	const [user] = users

	if (!user) throw new ORPCError("UNAUTHORIZED")

	return next({
		context: {
			user,
			verifiedData,
		},
	})
})

const verifyVKInitData = (initData?: string) => {
	if (!initData) return null

	let sign: string | undefined
	const queryParams: { key: string; value: string }[] = []

	const processQueryParam = (key: string, value: string) => {
		if (key === "sign") {
			sign = value
		} else if (key.startsWith("vk_")) {
			queryParams.push({ key, value })
		}
	}

	const formattedSearch = initData?.startsWith("?")
		? initData.slice(1)
		: initData

	for (const param of formattedSearch.split("&")) {
		const [key, value] = param.split("=")
		processQueryParam(key ?? "", value ?? "")
	}

	if (!sign || queryParams.length === 0) return null

	const queryString = queryParams
		.sort((a, b) => a.key.localeCompare(b.key))
		.reduce(
			(acc, { key, value }, idx) =>
				`${acc + (idx === 0 ? "" : "&")}${key}=${encodeURIComponent(value)}`,
			"",
		)

	const paramsHash = crypto
		.createHmac("sha256", env.vkClientSecret)
		.update(queryString)
		.digest()
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=$/, "")

	if (paramsHash === sign) {
		return Object.fromEntries(
			formattedSearch.split("&").map((entry) => entry.split("=")),
		) as {
			vk_access_token_settings: string
			vk_app_id: string
			vk_are_notifications_enabled: string
			vk_is_app_user: string
			vk_is_favorite: string
			vk_language: string
			vk_platform: string
			vk_ref: string
			vk_ts: string
			vk_user_id: string
			vk_testing_group_id?: string
			vk_profile_id?: string
			sign: string
			[key: string]: string | undefined
		}
	}

	return null
}
