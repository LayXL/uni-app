import objectToQuery from "shared/object-to-query.ts"
import { env } from "../env.ts"

export type Session = {
  cookie: string
  session_id: string
  user_id: number
  timestamp: number
}

export default async function (
  login: string,
  password: string
): Promise<Session> {
  const authUrl = `${env.BITRIX_URL}auth/index.php?login=yes`

  const authResponse = await fetch(authUrl, {
    method: "POST",
    body: objectToQuery({
      AUTH_FORM: "Y",
      TYPE: "AUTH",
      USER_LOGIN: login,
      USER_PASSWORD: password,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    redirect: "manual",
  })

  if (authResponse.status !== 200)
    throw new Error(`Invalid auth status: ${authResponse.status}`)

  const body = await authResponse.text()

  const cookie = authResponse.headers.get("set-cookie")?.split(";").at(0)

  if (!cookie) throw new Error(`Can't find cookie: ${cookie}`)

  let bx = ""

  for (const group of body.matchAll(
    /\(window\.BX\|\|top\.BX\)\.message\((.*)\)/gm
  )) {
    bx = group[1].replace(/'/g, '"')
  }

  if (!bx) throw new Error("Can't parse")

  const { bitrix_sessid, USER_ID } = JSON.parse(bx) as {
    bitrix_sessid: string
    USER_ID: string
  }

  return {
    cookie,
    session_id: bitrix_sessid,
    user_id: Number.parseInt(USER_ID),
    timestamp: Date.now(),
  }
}
