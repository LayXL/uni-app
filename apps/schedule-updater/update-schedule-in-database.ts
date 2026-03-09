import { getAllGroups } from "@repo/bitrix/schedule/get-all-groups"
import { getSchedule } from "@repo/bitrix/schedule/get-schedule"
import { getTeacherSchedule } from "@repo/bitrix/schedule/get-teacher-schedule"
import { getSession } from "@repo/bitrix/session/get-session"
import { classesTable, db, groupsTable, gte } from "@repo/drizzle"
import { env } from "@repo/env"
import { getSubjectIdByName } from "@repo/shared/get-subject-id-by-name"

const REQUEST_DELAY_MS = 100

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const normalizeClassroom = (value: string) => value.trim()

export const updateScheduleInDatabase = async () => {
	console.info("Updating schedule in database")

	const { cookie } = await getSession(env.bitrixLogin, env.bitrixPassword)

	const groups = await getGroups(cookie)

	const newClasses: (typeof classesTable.$inferInsert)[] = []
	const classesByUniqueKey = new Map<string, number>()

	let i = 0

	for (const group of groups) {
		if (i > 0) {
			await sleep(REQUEST_DELAY_MS)
		}

		console.info(
			`[${i + 1}/${groups.length}] Parsing ${group.id} — ${group.displayName}`,
		)

		const data =
			group.type === "teacher"
				? await getTeacherSchedule(group.bitrixId, cookie)
				: await getSchedule(group.displayName, cookie)

		if (!data) continue

		for (const scheduleItem of data) {
			const subjectId = await getSubjectIdByName(scheduleItem.subject)
			const normalizedClassroom = normalizeClassroom(scheduleItem.classroom)
			const classKey = [
				scheduleItem.date,
				scheduleItem.order,
				subjectId,
				normalizedClassroom,
			].join("|")

			const existingClassIndex = classesByUniqueKey.get(classKey) ?? -1

			if (existingClassIndex !== -1) {
				const existingClass = newClasses[existingClassIndex]

				if (existingClass) {
					existingClass.groups ??= []
					if (!existingClass.groups.includes(group.id))
						existingClass.groups.push(group.id)
				}
			} else {
				const newClassIndex = newClasses.length

				newClasses.push({
					date: scheduleItem.date,
					order: scheduleItem.order,
					subject: subjectId,
					classroom: normalizedClassroom,
					groups: [group.id],
					isCancelled: scheduleItem.isCancelled,
					isDistance: scheduleItem.isDistance,
					isChanged: scheduleItem.isChanged,
					original: scheduleItem.original,
				})

				classesByUniqueKey.set(classKey, newClassIndex)
			}
		}

		i++
	}

	const minDate = newClasses[0]?.date

	if (!minDate) {
		console.info("No classes found in database, skipping update")
		return
	}

	await db.transaction(async (tx) => {
		await tx.delete(classesTable).where(gte(classesTable.date, minDate))
		await tx.insert(classesTable).values(newClasses)
	})

	console.info("Schedule in database updated")
}

const getGroups = async (cookie: string) => {
	const groups = await db.query.groupsTable.findMany()

	if (groups.length === 0) {
		console.info("No groups found in database, fetching from Bitrix")

		const newGroups = await getAllGroups(cookie)

		return db.insert(groupsTable).values(newGroups).returning()
	}

	return groups
}
