type TimeRange = {
	start: string
	end: string
}

export type OpeningHoursEntry = {
	days: string
	weekdays: number[]
	hours: TimeRange | null
	breaks?: (TimeRange & { label: string })[]
}

// Stable entity IDs from the building scheme, independent of display names.
export const roomOpeningHours: Partial<Record<number, OpeningHoursEntry[]>> = {
	// Столовая
	1: [
		{
			days: "Пн",
			weekdays: [1],
			hours: { start: "11:00", end: "17:00" },
			breaks: [{ label: "Спецобслуживание", start: "12:20", end: "13:00" }],
		},
		{
			days: "Вт–Пт",
			weekdays: [2, 3, 4, 5],
			hours: { start: "11:00", end: "17:00" },
			breaks: [{ label: "Спецобслуживание", start: "12:00", end: "13:00" }],
		},
		{ days: "Сб-Вс", weekdays: [6, 0], hours: null },
	],
	// Бистро «Апельсин», переименованное на карте в «Буфет».
	12: [
		{
			days: "Будние",
			weekdays: [1, 2, 3, 4, 5],
			hours: { start: "09:00", end: "20:00" },
			breaks: [{ label: "Обед", start: "14:30", end: "15:00" }],
		},
		{
			days: "Сб-Вс",
			weekdays: [6, 0],
			hours: { start: "09:00", end: "15:00" },
		},
	],
	// Магазин на первом этаже
	21: [
		{
			days: "Будние",
			weekdays: [1, 2, 3, 4, 5],
			hours: { start: "09:00", end: "16:00" },
		},
		{ days: "Сб-Вс", weekdays: [6, 0], hours: null },
	],
	// Касса, кабинет 205
	70: [
		{
			days: "Будние",
			weekdays: [1, 2, 3, 4, 5],
			hours: { start: "09:00", end: "16:00" },
			breaks: [
				{ label: "Обед", start: "13:45", end: "14:15" },
				{ label: "Технический перерыв", start: "15:30", end: "16:00" },
			],
		},
		{ days: "Сб-Вс", weekdays: [6, 0], hours: null },
	],
}
