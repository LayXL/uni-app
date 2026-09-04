import { formatOpeningTime } from "./format-opening-time"
import type { OpeningHoursEntry } from "./room-opening-hours"

const weekdays = [
	"воскресенья",
	"понедельника",
	"вторника",
	"среды",
	"четверга",
	"пятницы",
	"субботы",
]

const toMinutes = (time: string) => {
	const [hours, minutes] = time.split(":").map(Number)
	return hours * 60 + minutes
}

const getOpenIntervals = ({ hours, breaks = [] }: OpeningHoursEntry) => {
	if (!hours) return []

	let intervals = [hours]
	for (const pause of breaks) {
		intervals = intervals.flatMap((interval) => {
			if (pause.end <= interval.start || pause.start >= interval.end) {
				return [interval]
			}

			return [
				...(pause.start > interval.start
					? [{ start: interval.start, end: pause.start }]
					: []),
				...(pause.end < interval.end
					? [{ start: pause.end, end: interval.end }]
					: []),
			]
		})
	}
	return intervals
}

// `now` contains local Yekaterinburg clock fields, as returned by the map's clock hook.
export const getOpeningHoursStatus = (
	openingHours: OpeningHoursEntry[],
	now: Date,
) => {
	const minutes = now.getHours() * 60 + now.getMinutes()

	for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
		const weekday = (now.getDay() + dayOffset) % 7
		const entry = openingHours.find(({ weekdays }) =>
			weekdays.includes(weekday),
		)
		if (!entry) continue

		for (const interval of getOpenIntervals(entry)) {
			if (dayOffset === 0) {
				if (minutes >= toMinutes(interval.end)) continue
				if (minutes >= toMinutes(interval.start)) {
					return `Открыто до ${formatOpeningTime(interval.end)}`
				}
				return `Закрыто до ${formatOpeningTime(interval.start)}`
			}

			return `Закрыто до ${weekdays[weekday]}, ${formatOpeningTime(interval.start)}`
		}
	}

	return "Закрыто"
}
