type TimeRange = {
	start: string
	end: string
}

type Attachment = {
	number: number
	time: TimeRange
}

type ScheduleItem = {
	number: number
	time: TimeRange
	type?: "lunch" | string
	attachments?: Attachment[]
}

type DayTimetable = {
	days: number[]
	weekday?: boolean
	schedule: ScheduleItem[]
}

export type Timetable = DayTimetable[]
