import ky from "ky"

import { env } from "@repo/env"

export const bitrix = ky.create({
	prefixUrl: env.bitrixUrl,
})
