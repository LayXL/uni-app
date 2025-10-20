import { updateScheduleInDatabase } from "@repo/shared/update-schedule-in-database"

updateScheduleInDatabase().then(() => {
  process.exit(0)
})
