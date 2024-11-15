import { delay } from "shared/delay.ts"
import parseTeacherSchedule, {
  type TeacherSchedule,
} from "./parseTeacherSchedule.ts"

export default async function (
  teacher: string,
  cookie: string
): Promise<{ teacher: string; schedule: TeacherSchedule } | undefined> {
  await delay(500)

  const url = `${<string>Bun.env.BITRIX_URL}mobile/teacher/schedule/teacher.php?id=${teacher}`

  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  const body = await response.text()

  const parsedSchedule = parseTeacherSchedule(body)

  return parsedSchedule
    ? {
        teacher,
        schedule: parsedSchedule,
      }
    : undefined
}
