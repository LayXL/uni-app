import parse from "node-html-parser"
import { env } from "../env.ts"

export const getUserData = async (userId: number, cookie: string) => {
  const url = `${env.BITRIX_URL}mobile/users/?user_id=${userId}`

  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((res) => res.text())

  const root = parse(response)

  const name = root.querySelector(".emp-profile-name")?.innerText

  return {
    name,
  }
}
