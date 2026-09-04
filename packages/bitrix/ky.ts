import { setTimeout as sleep } from "node:timers/promises"
import type { Options } from "ky"
import ky, { HTTPError, TimeoutError } from "ky"

import { env } from "@repo/env"

export const bitrix = ky.create({
	prefixUrl: env.bitrixUrl,
})

const SERVICE_RECOVERY_DELAY_MS = 30_000
const TIMEOUT_RECOVERY_DELAY_MS = 1_000
const BITRIX_REQUEST_TIMEOUT_MS = 30_000
const MAX_TIMEOUT_RETRIES = 3

const isServiceUnavailableError = (error: unknown) => {
	return error instanceof HTTPError && error.response.status === 503
}

export const getBitrixTextWithRecovery = async (
	path: string,
	options: Options,
) => {
	let timeoutRetries = 0

	while (true) {
		options.signal?.throwIfAborted()
		try {
			return await bitrix
				.get(path, { timeout: BITRIX_REQUEST_TIMEOUT_MS, ...options })
				.text()
		} catch (error) {
			options.signal?.throwIfAborted()
			if (isServiceUnavailableError(error)) {
				await sleep(SERVICE_RECOVERY_DELAY_MS, undefined, {
					signal: options.signal ?? undefined,
				})
				continue
			}

			if (
				!(error instanceof TimeoutError) ||
				timeoutRetries >= MAX_TIMEOUT_RETRIES
			) {
				throw error
			}

			timeoutRetries++
			await sleep(TIMEOUT_RECOVERY_DELAY_MS, undefined, {
				signal: options.signal ?? undefined,
			})
		}
	}
}
