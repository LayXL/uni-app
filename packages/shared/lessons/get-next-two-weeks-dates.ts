import { addDays, getDay } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

import { getTestNow } from "../time/test-time"

export const getNextTwoWeeksDates = (options?: { now?: Date }) => {
	const now = options?.now ?? getTestNow()

	return Array.from({ length: 14 }, (_, i) =>
		formatInTimeZone(addDays(now, i), "Asia/Yekaterinburg", "yyyy-MM-dd"),
	).filter((date) => getDay(new Date(date)) !== 0)
}
