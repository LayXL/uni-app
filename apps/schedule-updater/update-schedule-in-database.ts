import { getAllGroups } from "@repo/bitrix/schedule/get-all-groups"
import { getSchedule } from "@repo/bitrix/schedule/get-schedule"
import { getTeacherSchedule } from "@repo/bitrix/schedule/get-teacher-schedule"
import { getSession } from "@repo/bitrix/session/get-session"
import { and, classesTable, db, eq, groupsTable, gt, gte } from "@repo/drizzle"
import { env } from "@repo/env"
import { getSubjectIdByName } from "@repo/shared/get-subject-id-by-name"

import { getParsingTimeRemaining } from "./parsing-window"

const REQUEST_DELAY_MS = 100

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const updateScheduleInDatabase = async () => {
	const timeRemaining = getParsingTimeRemaining()
	if (timeRemaining === 0) {
		console.info(
			"Skipping schedule update outside 05:00–19:00 Asia/Yekaterinburg",
		)
		return
	}

	const controller = new AbortController()
	const deadline = setTimeout(() => controller.abort(), timeRemaining)
	try {
		await parseAndSaveSchedule(controller.signal)
	} catch (error) {
		if (!controller.signal.aborted) throw error
		console.info(
			"Schedule parsing stopped at 19:00 Asia/Yekaterinburg; incomplete update discarded",
		)
	} finally {
		clearTimeout(deadline)
	}
}

const parseAndSaveSchedule = async (signal: AbortSignal) => {
	console.info("Updating schedule in database")

	const { cookie } = await getSession(
		env.bitrixLogin,
		env.bitrixPassword,
		signal,
	)

	const groups = await getGroups(cookie, signal)

	const newClasses: (typeof classesTable.$inferSelect)[] = []

	let i = 0

	for (const group of groups) {
		if (i > 0) {
			await sleep(REQUEST_DELAY_MS)
		}
		signal.throwIfAborted()

		console.info(
			`[${i + 1}/${groups.length}] Parsing ${group.id} — ${group.displayName}`,
		)

		const data =
			group.type === "teacher"
				? await getTeacherSchedule(group.bitrixId, cookie, signal)
				: await getSchedule(group.displayName, cookie, signal)

		if (!data) continue

		for (const scheduleItem of data) {
			signal.throwIfAborted()
			const subjectId = await getSubjectIdByName(scheduleItem.subject)

			const existingClassIndex = newClasses.findIndex(
				(x) =>
					x.date === scheduleItem.date &&
					x.order === scheduleItem.order &&
					x.subject === subjectId &&
					x.classroom === scheduleItem.classroom,
			)

			if (existingClassIndex !== -1) {
				if (!newClasses[existingClassIndex].groups.includes(group.id))
					newClasses[existingClassIndex].groups.push(group.id)
			} else {
				newClasses.push({
					date: scheduleItem.date,
					order: scheduleItem.order,
					subject: subjectId,
					classroom: scheduleItem.classroom,
					groups: [group.id],
					isCancelled: scheduleItem.isCancelled,
					isDistance: scheduleItem.isDistance,
					isChanged: scheduleItem.isChanged,
					original: scheduleItem.original,
				})
			}
		}

		i++
	}

	const minDate = newClasses.reduce<string | null>((min, item) => {
		if (!min) return item.date
		return item.date < min ? item.date : min
	}, null)

	if (!minDate) {
		console.info("No classes found in database, skipping update")
		return
	}

	await db.transaction(async (tx) => {
		signal.throwIfAborted()
		await tx.delete(classesTable).where(gte(classesTable.date, minDate))
		await tx.insert(classesTable).values(newClasses)
		signal.throwIfAborted()
	})

	console.info("Schedule in database updated")
}

const getGroups = async (cookie: string, signal: AbortSignal) => {
	const groups = await db
		.select()
		.from(groupsTable)
		.where(and(eq(groupsTable.isDeleted, false), gt(groupsTable.id, 0)))

	if (groups.length === 0) {
		console.info("No groups found in database, fetching from Bitrix")

		const newGroups = await getAllGroups(cookie, signal)
		signal.throwIfAborted()

		return db.insert(groupsTable).values(newGroups).returning()
	}

	return groups
}
