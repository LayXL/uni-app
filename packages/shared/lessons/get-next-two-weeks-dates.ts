import { addDays, getDay } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export const getNextTwoWeeksDates = () => {
	return Array.from({ length: 14 }, (_, i) =>
		formatInTimeZone(
			addDays(new Date(), i),
			"Asia/Yekaterinburg",
			"yyyy-MM-dd",
		),
	).filter((date) => getDay(new Date(date)) !== 0)
}
