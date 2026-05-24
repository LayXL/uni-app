import { cookies } from "next/headers"

import {
	getTestNow,
	LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE,
	parseTestTimeOffsetDaysAsHours,
	parseTestTimeOffsetHours,
	TEST_TIME_OFFSET_HOURS_COOKIE,
} from "@repo/shared/time/test-time"

export const getServerTestNow = async () => {
	const cookiesMap = await cookies()
	const offsetCookie = cookiesMap.get(TEST_TIME_OFFSET_HOURS_COOKIE)?.value
	const legacyOffsetCookie = cookiesMap.get(
		LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE,
	)?.value

	if (offsetCookie === undefined && legacyOffsetCookie === undefined) {
		return getTestNow()
	}

	const offsetHours =
		parseTestTimeOffsetHours(offsetCookie) ||
		parseTestTimeOffsetDaysAsHours(legacyOffsetCookie)

	return getTestNow(offsetHours)
}
