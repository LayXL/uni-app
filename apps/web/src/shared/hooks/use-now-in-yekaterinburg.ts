"use client"

import { useEffect, useState } from "react"

import { getClientTestNow } from "@/shared/utils/test-time"

export const getNowInYekaterinburg = () =>
	new Date(
		getClientTestNow().toLocaleString("en-US", {
			timeZone: "Asia/Yekaterinburg",
		}),
	)

export const useNowInYekaterinburg = (updateInterval = 30_000) => {
	const [now, setNow] = useState<Date>(getNowInYekaterinburg())

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(getNowInYekaterinburg())
		}, updateInterval)

		return () => clearInterval(interval)
	}, [updateInterval])

	return now
}
