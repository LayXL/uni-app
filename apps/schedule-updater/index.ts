import { Cron } from "croner"
import { updateScheduleInDatabase } from "shared/update-schedule-in-database.ts"

new Cron("0 5-19 * * *", { timezone: "Asia/Yekaterinburg" }, () => {
  updateScheduleInDatabase()
})

console.info("Schedule updater started")
