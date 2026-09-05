import { ORPCError } from "@orpc/client"

import { getAllGroups } from "@repo/bitrix/schedule/get-all-groups"
import { getSession } from "@repo/bitrix/session/get-session"
import { and, db, eq, groupsTable, gt, inArray, sql } from "@repo/drizzle"
import { env } from "@repo/env"

import { getS3Bucket } from "../../lib/s3"
import { privateProcedure } from "../../procedures/private"
import { syncTeacherAvatars } from "./sync-teacher-avatars"

const GROUPS_SYNC_LOCK_ID = 20_260_828

type BitrixGroup = Awaited<ReturnType<typeof getAllGroups>>[number]
type StoredGroup = typeof groupsTable.$inferSelect

const getGroupKey = (group: Pick<BitrixGroup, "bitrixId" | "type">) =>
	JSON.stringify([group.type, group.bitrixId])

const getExactGroupKey = (group: BitrixGroup) =>
	JSON.stringify([group.type, group.bitrixId, group.displayName])

const prepareGroups = (groups: BitrixGroup[]) => {
	const uniqueGroups = new Map<string, BitrixGroup>()

	for (const group of groups) {
		const preparedGroup = {
			...group,
			displayName: group.displayName.trim(),
		}

		uniqueGroups.set(getExactGroupKey(preparedGroup), preparedGroup)
	}

	return [...uniqueGroups.values()]
}

const groupByBitrixId = <T extends Pick<BitrixGroup, "bitrixId" | "type">>(
	groups: T[],
) => {
	const grouped = new Map<string, T[]>()

	for (const group of groups) {
		const key = getGroupKey(group)
		grouped.set(key, [...(grouped.get(key) ?? []), group])
	}

	return grouped
}

const matchGroups = (
	incomingGroups: BitrixGroup[],
	storedGroups: StoredGroup[],
) => {
	const matches = new Map<BitrixGroup, StoredGroup>()
	const storedGroupsByBitrixId = groupByBitrixId(storedGroups)

	for (const incomingGroupSet of groupByBitrixId(incomingGroups).values()) {
		const storedGroupSet = storedGroupsByBitrixId.get(
			getGroupKey(incomingGroupSet[0]),
		)

		if (!storedGroupSet) continue

		const availableStoredGroups = storedGroupSet.toSorted(
			(a, b) =>
				Number(a.isDeleted) - Number(b.isDeleted) ||
				a.displayName.localeCompare(b.displayName, "ru") ||
				a.id - b.id,
		)

		const unmatchedIncomingGroups: BitrixGroup[] = []

		for (const incomingGroup of incomingGroupSet) {
			const exactMatchIndex = availableStoredGroups.findIndex(
				(storedGroup) => storedGroup.displayName === incomingGroup.displayName,
			)

			if (exactMatchIndex === -1) {
				unmatchedIncomingGroups.push(incomingGroup)
				continue
			}

			const [exactMatch] = availableStoredGroups.splice(exactMatchIndex, 1)
			matches.set(incomingGroup, exactMatch)
		}

		if (unmatchedIncomingGroups.length !== availableStoredGroups.length)
			continue

		const sortedIncomingGroups = unmatchedIncomingGroups.toSorted((a, b) =>
			a.displayName.localeCompare(b.displayName, "ru"),
		)

		for (const [index, incomingGroup] of sortedIncomingGroups.entries()) {
			matches.set(incomingGroup, availableStoredGroups[index])
		}
	}

	return matches
}

const synchronizeGroups = async () => {
	// Fail before changing groups if avatar storage is not configured.
	getS3Bucket()
	const { cookie } = await getSession(env.bitrixLogin, env.bitrixPassword)
	const fetchedGroups = await getAllGroups(cookie)
	const incomingGroups = prepareGroups(fetchedGroups)
	const studentsCount = incomingGroups.filter(
		(group) => group.type === "studentsGroup",
	).length
	const teachersCount = incomingGroups.length - studentsCount

	// biome-ignore lint/suspicious/noConsole: Operational diagnostics for manual synchronization
	console.info("Groups received from Bitrix", {
		fetched: fetchedGroups.length,
		unique: incomingGroups.length,
		students: studentsCount,
		teachers: teachersCount,
		duplicatesSkipped: fetchedGroups.length - incomingGroups.length,
	})

	if (studentsCount === 0 || teachersCount === 0) {
		throw new Error(
			`Bitrix returned an incomplete group list: students=${studentsCount}, teachers=${teachersCount}`,
		)
	}

	const { teachers, ...result } = await db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(${GROUPS_SYNC_LOCK_ID})`)

		const storedGroups = await tx
			.select()
			.from(groupsTable)
			.where(gt(groupsTable.id, 0))
		const matches = matchGroups(incomingGroups, storedGroups)
		const matchedStoredGroupIds = new Set(
			[...matches.values()].map((group) => group.id),
		)
		const groupsToCreate = incomingGroups.filter((group) => !matches.has(group))
		const matchedGroups = [...matches.entries()]
		const groupsToRename = matchedGroups.filter(
			([incomingGroup, storedGroup]) =>
				incomingGroup.displayName !== storedGroup.displayName,
		)
		const matchedGroupIds = matchedGroups.map(([, group]) => group.id)

		const deactivated = storedGroups.filter(
			(group) => !group.isDeleted && !matchedStoredGroupIds.has(group.id),
		).length
		const restored = matchedGroups.filter(([, group]) => group.isDeleted).length

		await tx
			.update(groupsTable)
			.set({ isDeleted: true })
			.where(and(gt(groupsTable.id, 0), eq(groupsTable.isDeleted, false)))

		if (matchedGroupIds.length > 0) {
			await tx
				.update(groupsTable)
				.set({ isDeleted: false })
				.where(inArray(groupsTable.id, matchedGroupIds))
		}

		for (const [incomingGroup, storedGroup] of groupsToRename) {
			await tx
				.update(groupsTable)
				.set({ displayName: incomingGroup.displayName, isDeleted: false })
				.where(eq(groupsTable.id, storedGroup.id))
		}

		if (groupsToCreate.length > 0) {
			await tx.insert(groupsTable).values(groupsToCreate)
		}

		const teachers = await tx
			.select({ id: groupsTable.id, bitrixId: groupsTable.bitrixId })
			.from(groupsTable)
			.where(
				and(
					gt(groupsTable.id, 0),
					eq(groupsTable.type, "teacher"),
					eq(groupsTable.isDeleted, false),
				),
			)

		return {
			teachers,
			total: incomingGroups.length,
			created: groupsToCreate.length,
			updated: groupsToRename.length,
			restored,
			deactivated,
			duplicatesSkipped: fetchedGroups.length - incomingGroups.length,
		}
	})

	// Network and image processing happen after the DB transaction has committed.
	const avatars = await syncTeacherAvatars(teachers, cookie)
	// biome-ignore lint/suspicious/noConsole: Operational diagnostics for manual synchronization
	console.info("Teacher avatars synchronized", avatars)
	return { ...result, avatars }
}

export const syncGroups = privateProcedure.handler(async ({ context }) => {
	if (!context.user.isAdmin) {
		throw new ORPCError("FORBIDDEN")
	}

	try {
		return await synchronizeGroups()
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: Preserve the original synchronization error in server logs
		console.error("Failed to synchronize groups with Bitrix", error)
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Не удалось синхронизировать группы с Bitrix",
		})
	}
})
