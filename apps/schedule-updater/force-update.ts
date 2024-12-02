import { updateScheduleInDatabase } from "shared/update-schedule-in-database.ts"

updateScheduleInDatabase().then(() => {
  process.exit(0)
})
