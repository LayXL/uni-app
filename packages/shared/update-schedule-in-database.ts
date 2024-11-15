import getSchedule from "bitrix/schedule/getSchedule.ts"
import getTeacherSchedule from "bitrix/schedule/getTeacherSchedule.ts"
import getSession from "bitrix/session/getSession.ts"
import { format } from "date-fns/format"
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

  for (const group of groups) {
    const data = group.isTeacher
      ? await getTeacherSchedule(group.bitrixId, cookie)
      : await getSchedule(group.bitrixId, cookie)

    if (!data) continue

    for (const scheduleItem of data.schedule) {
      for (const item of scheduleItem.schedule) {
        const subjectName = item.subject?.trim()
        const classroom = item.classroom?.trim()

        if (!subjectName || !classroom) continue

        const date = format(scheduleItem.date, "yyyy-MM-dd")
        const subjectId = await getSubjectIdByName(subjectName)

        const existingClassIndex = newClasses.findIndex(
          (x) =>
            x.date === date &&
            x.order === item.number &&
            x.subject === subjectId &&
            x.classroom === classroom
        )

        if (
          existingClassIndex !== -1 &&
          !newClasses[existingClassIndex].groups.includes(group.id)
        ) {
          newClasses[existingClassIndex].groups.push(group.id)
        } else {
          newClasses.push({
            date: date,
            order: item.number,
            subject: subjectId,
            classroom,
            groups: [group.id],
            isCancelled: item.cancelled ?? false,
          })
        }
      }
    }
  }

  const minDate = newClasses[0].date

  await db.transaction(async (tx) => {
    await tx.delete(classes).where(gte(classes.date, minDate))
    await tx.insert(classes).values(newClasses)
  })

  console.info("Updated schedule in database")
}
