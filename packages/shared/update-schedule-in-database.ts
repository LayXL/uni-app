import getSchedule from "bitrix/schedule/getSchedule.ts"
import getTeacherSchedule from "bitrix/schedule/getTeacherSchedule.ts"
import getSession from "bitrix/session/getSession.ts"
import { db } from "drizzle"
import { gte } from "drizzle-orm"
import { classes } from "drizzle/schema.ts"
import { z } from "zod"
import { getSubjectIdByName } from "./get-subject-id-by-name.ts"

const config = z
  .object({
    login: z.string(),
    password: z.string(),
    bitrixUrl: z.string().url(),
  })
  .parse({
    login: Bun.env.BITRIX_LOGIN,
    password: Bun.env.BITRIX_PASSWORD,
    bitrixUrl: Bun.env.BITRIX_URL,
  })

export const updateScheduleInDatabase = async () => {
  console.info("Updating schedule in database")

  const { cookie } = await getSession(config.login, config.password)

  const groups = await db.query.groups.findMany()

  const newClasses: (typeof classes.$inferSelect)[] = []

  let i = 0

  for (const group of groups) {
    console.info(
      `[${i + 1}/${groups.length}] Parsing ${group.id} — ${group.displayName}`
    )

    const data = group.isTeacher
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
          x.classroom === scheduleItem.classroom
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
    await tx.delete(classes).where(gte(classes.date, minDate))
    await tx.insert(classes).values(newClasses)
  })

  console.info("Schedule in database updated")
}
