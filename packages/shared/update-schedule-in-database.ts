import { gte } from "drizzle-orm"

import { getAllGroups } from "@repo/bitrix/schedule/get-all-groups"
import { getSchedule } from "@repo/bitrix/schedule/get-schedule"
import { getTeacherSchedule } from "@repo/bitrix/schedule/get-teacher-schedule"
import { getSession } from "@repo/bitrix/session/get-session"
import { classesTable, db, groupsTable } from "@repo/drizzle"
import { env } from "@repo/env"

import { getSubjectIdByName } from "./get-subject-id-by-name"

export const updateScheduleInDatabase = async () => {
	console.info("Updating schedule in database")

	const { cookie } = await getSession(env.bitrixLogin, env.bitrixPassword)

	const groups = await getGroups(cookie)

	const newClasses: (typeof classesTable.$inferSelect)[] = []

	let i = 0

	for (const group of groups) {
		console.info(
			`[${i + 1}/${groups.length}] Parsing ${group.id} — ${group.displayName}`,
		)

		const data =
			group.type === "teacher"
				? await getTeacherSchedule(group.bitrixId, cookie)
				: await getSchedule(group.bitrixId, cookie)

		if (!data) continue

		for (const scheduleItem of data) {
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

	const minDate = newClasses[0].date

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
