import { addDays } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export const getNextTwoWeeksDates = () => {
	return Array.from({ length: 14 }, (_, i) =>
		formatInTimeZone(
			addDays(new Date(), i),
			"Asia/Yekaterinburg",
			"yyyy-MM-dd",
		),
	)
}
