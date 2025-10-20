import { Cron } from "croner"
import { updateScheduleInDatabase } from "@repo/shared/update-schedule-in-database"

new Cron("0 5-19 * * *", { timezone: "Asia/Yekaterinburg" }, () => {
  void updateScheduleInDatabase()
})

console.info("Schedule updater started")
