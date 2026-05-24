import { env } from "@repo/env"
import {
	LEGACY_TEST_TIME_OFFSET_DAYS_HEADER,
	parseTestTimeOffsetDaysAsHours,
	parseTestTimeOffsetHours,
	TEST_TIME_OFFSET_HOURS_HEADER,
} from "@repo/shared/time/test-time"

import type { Context } from "../base"

export const getContextTestTimeOffsetHours = (context: Context) => {
	const headerOffset = parseTestTimeOffsetHours(
		context.headers?.get(TEST_TIME_OFFSET_HOURS_HEADER),
	)
	const legacyHeaderOffset = parseTestTimeOffsetDaysAsHours(
		context.headers?.get(LEGACY_TEST_TIME_OFFSET_DAYS_HEADER),
	)

	return (
		headerOffset ||
		legacyHeaderOffset ||
		env.testTimeOffsetHours ||
		env.testTimeOffsetDays * 24
	)
}

export const getContextTestNow = (context: Context) => {
	const offsetHours = getContextTestTimeOffsetHours(context)

	return new Date(Date.now() + offsetHours * 60 * 60 * 1000)
}
