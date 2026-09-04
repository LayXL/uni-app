import { Cron } from "croner"

import { PARSING_CRON, PARSING_TIMEZONE } from "./parsing-window"
import { updateScheduleInDatabase } from "./update-schedule-in-database"

new Cron(
	PARSING_CRON,
	{ timezone: PARSING_TIMEZONE, protect: true },
	updateScheduleInDatabase,
)

console.info("Schedule updater started")
