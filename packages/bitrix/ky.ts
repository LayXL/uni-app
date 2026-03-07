import type { Options } from "ky"
import ky, { HTTPError } from "ky"

import { env } from "@repo/env"

export const bitrix = ky.create({
	prefixUrl: env.bitrixUrl,
})

const SERVICE_RECOVERY_DELAY_MS = 30_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isServiceUnavailableError = (error: unknown) => {
	return error instanceof HTTPError && error.response.status === 503
}

export const getBitrixTextWithRecovery = async (
	path: string,
	options: Options,
) => {
	while (true) {
		try {
			return await bitrix.get(path, options).text()
		} catch (error) {
			if (!isServiceUnavailableError(error)) {
				throw error
			}

			await sleep(SERVICE_RECOVERY_DELAY_MS)
		}
	}
}
