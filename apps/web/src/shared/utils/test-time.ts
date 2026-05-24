"use client"

import Cookies from "js-cookie"

import {
	LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE,
	LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY,
	parseTestTimeOffsetDaysAsHours,
	parseTestTimeOffsetHours,
	TEST_TIME_OFFSET_HOURS_COOKIE,
	TEST_TIME_OFFSET_HOURS_STORAGE_KEY,
} from "@repo/shared/time/test-time"

export const getClientTestTimeOffsetHours = () =>
	parseTestTimeOffsetHours(
		window.localStorage.getItem(TEST_TIME_OFFSET_HOURS_STORAGE_KEY),
	) ||
	parseTestTimeOffsetDaysAsHours(
		window.localStorage.getItem(LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY),
	)

export const setClientTestTimeOffsetHours = (offsetHours: number) => {
	const normalizedOffsetHours = parseTestTimeOffsetHours(offsetHours)

	window.localStorage.removeItem(LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY)
	Cookies.remove(LEGACY_TEST_TIME_OFFSET_DAYS_COOKIE, { path: "/" })

	if (normalizedOffsetHours === 0) {
		window.localStorage.removeItem(TEST_TIME_OFFSET_HOURS_STORAGE_KEY)
		Cookies.remove(TEST_TIME_OFFSET_HOURS_COOKIE, { path: "/" })
		return
	}

	window.localStorage.setItem(
		TEST_TIME_OFFSET_HOURS_STORAGE_KEY,
		normalizedOffsetHours.toString(),
	)
	Cookies.set(TEST_TIME_OFFSET_HOURS_COOKIE, normalizedOffsetHours.toString(), {
		expires: 365,
		path: "/",
		sameSite: "lax",
	})
}

export const getClientTestNow = () =>
	new Date(Date.now() + getClientTestTimeOffsetHours() * 60 * 60 * 1000)
