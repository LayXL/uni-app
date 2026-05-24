const HOUR_IN_MS = 60 * 60 * 1000
const HOURS_IN_DAY = 24
const MAX_TEST_TIME_OFFSET_HOURS = 366 * HOURS_IN_DAY

export const TEST_TIME_OFFSET_HOURS_HEADER = "x-test-time-offset-hours"
export const TEST_TIME_OFFSET_HOURS_COOKIE = "test_time_offset_hours"
export const TEST_TIME_OFFSET_HOURS_STORAGE_KEY = "testTimeOffsetHours"

export const LEGACY_TEST_TIME_OFFSET_DAYS_HEADER = "x-test-time-offset-days"
export const LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE = "test_time_offset_days"
export const LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY = "testTimeOffsetDays"

export const parseTestTimeOffsetHours = (value: unknown) => {
	if (value === null || value === undefined || value === "") {
		return 0
	}

	const parsed = Number(value)

	if (!Number.isFinite(parsed)) {
		return 0
	}

	const hours = Math.trunc(parsed)

	if (Math.abs(hours) > MAX_TEST_TIME_OFFSET_HOURS) {
		return 0
	}

	return hours
}

export const parseTestTimeOffsetDaysAsHours = (value: unknown) =>
	parseTestTimeOffsetHours(Number(value) * HOURS_IN_DAY)

export const getEnvTestTimeOffsetHours = () =>
	parseTestTimeOffsetHours(
		process.env.NEXT_PUBLIC_TEST_TIME_OFFSET_HOURS ??
			process.env.TEST_TIME_OFFSET_HOURS,
	)

export const getLegacyEnvTestTimeOffsetHours = () =>
	parseTestTimeOffsetDaysAsHours(
		process.env.NEXT_PUBLIC_TEST_TIME_OFFSET_DAYS ??
			process.env.TEST_TIME_OFFSET_DAYS,
	)

export const getRuntimeTestTimeOffsetHours = () => {
	if (typeof window === "undefined") {
		return getEnvTestTimeOffsetHours() || getLegacyEnvTestTimeOffsetHours()
	}

	const browserOffsetHours = parseTestTimeOffsetHours(
		window.localStorage.getItem(TEST_TIME_OFFSET_HOURS_STORAGE_KEY),
	)
	const legacyBrowserOffsetHours = parseTestTimeOffsetDaysAsHours(
		window.localStorage.getItem(LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY),
	)

	return (
		browserOffsetHours ||
		legacyBrowserOffsetHours ||
		getEnvTestTimeOffsetHours() ||
		getLegacyEnvTestTimeOffsetHours()
	)
}

export const addTestTimeOffset = (date: Date, offsetHours = 0) =>
	new Date(date.getTime() + offsetHours * HOUR_IN_MS)

export const getTestNow = (offsetHours = getRuntimeTestTimeOffsetHours()) =>
	addTestTimeOffset(new Date(), offsetHours)
