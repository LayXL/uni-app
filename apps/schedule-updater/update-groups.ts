import { getAllGroups } from "@repo/bitrix/schedule/get-all-groups"
import { getSession } from "@repo/bitrix/session/get-session"
import { env } from "@repo/env"

const { cookie } = await getSession(env.bitrixLogin, env.bitrixPassword)

await getAllGroups(cookie)

process.exit(0)