import { Cron } from "croner"

import { updateScheduleInDatabase } from "./update-schedule-in-database"

new Cron("30 5-19 * * *", { timezone: "Asia/Yekaterinburg" }, () => {
	updateScheduleInDatabase()
})

console.info("Schedule updater started")
