import { env } from "../env.ts"
import { parseSchedule } from "./parser/parseSchedule.ts"

export default async function (group: string, cookie: string) {
  const transformedGroup = group.split("(")[0]
  const url = `${env.BITRIX_URL}mobile/teacher/schedule/spo_and_vo.php?name=${transformedGroup}`

  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  const body = await response.text()

  return parseSchedule(body, group)
}
