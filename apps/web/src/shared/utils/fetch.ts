import { cookies } from "next/headers"

import {
	LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE,
	parseTestTimeOffsetDaysAsHours,
	parseTestTimeOffsetHours,
	TEST_TIME_OFFSET_HOURS_COOKIE,
	TEST_TIME_OFFSET_HOURS_HEADER,
} from "@repo/shared/time/test-time"

type ProcedureHandler<Input, Output> = (
	input: Input,
	options?: { context?: { headers?: Headers } },
) => Promise<Output>

export const getAuthHeaders = async () => {
	const cookiesMap = await cookies()

	const headers = new Headers()

	headers.set("cookie", cookiesMap.toString())

	const offsetHours =
		parseTestTimeOffsetHours(
			cookiesMap.get(TEST_TIME_OFFSET_HOURS_COOKIE)?.value,
		) ||
		parseTestTimeOffsetDaysAsHours(
			cookiesMap.get(LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE)?.value,
		)

	if (offsetHours !== 0) {
		headers.set(TEST_TIME_OFFSET_HOURS_HEADER, offsetHours.toString())
	}

	return headers
}

export const fetch = async <Input, Output>(
	fn: ProcedureHandler<Input, Output>,
	input: Input,
): Promise<Output> => {
	const headers = await getAuthHeaders()

	return fn(input, {
		context: { headers },
	})
}
