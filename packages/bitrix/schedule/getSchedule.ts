import { delay } from "shared/delay.ts"
import { env } from "../env.ts"
import parseSchedule, { type Schedule } from "./parseSchedule.ts"

export default async function (
  group: string,
  cookie: string
): Promise<{ group: string; schedule: Schedule } | undefined> {
  await delay(500)

  const transformedGroup = group.split("(")[0]

  console.info(`Getting schedule for ${group}`)

  const url = `${env.BITRIX_URL}mobile/teacher/schedule/spo_and_vo.php?name=${transformedGroup}`

  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  const body = await response.text()

  const parsedSchedule = parseSchedule(body, group)

  return parsedSchedule
    ? {
        group,
        schedule: parsedSchedule,
      }
    : undefined
}
