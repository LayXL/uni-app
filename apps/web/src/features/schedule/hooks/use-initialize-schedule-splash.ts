"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useEffect } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { useIsClient } from "@/shared/hooks/use-is-client"
import { getNowInYekaterinburg } from "@/shared/hooks/use-now-in-yekaterinburg"

import {
	getScheduleSplashes,
	type SplashGroup,
} from "../lib/get-schedule-splashes"
import { scheduleSplashStore } from "../lib/schedule-splash-store"
import { useScheduleSplash } from "./use-schedule-splash"

export const useInitializeScheduleSplash = (
	group: SplashGroup | null | undefined,
) => {
	const isClient = useIsClient()
	const title = useScheduleSplash()
	const today = format(getNowInYekaterinburg(), "yyyy-MM-dd")
	const dates = getNextTwoWeeksDates()
	// The normal schedule range excludes Sundays; explicitly fetch today then.
	if (!dates.includes(today)) dates.unshift(today)
	const query = useQuery({
		...orpc.schedule.getSchedule.queryOptions({
			input: { dates, group: group?.id },
		}),
		enabled: isClient && !!group && !title,
	})

	useEffect(() => {
		if (!group || title || (!query.isSuccess && !query.isError)) return
		scheduleSplashStore.start(
			getScheduleSplashes({
				group,
				schedule: query.isSuccess ? query.data : undefined,
				now: getNowInYekaterinburg(),
			}),
		)
	}, [group, title, query.isSuccess, query.isError, query.data])
}
