import { formatISO } from "date-fns/formatISO"
import { db } from "drizzle"
import { and, arrayContains, gte } from "drizzle-orm"
import { classes } from "drizzle/schema.ts"
import { populateLessons } from "./populate-lessons.ts"

export const getUpcomingLessons = async (group: number) => {
  const upcomingLessons = await db
    .select()
    .from(classes)
    .where(
      and(
        gte(classes.date, formatISO(new Date(), { representation: "date" })),
        arrayContains(classes.groups, [group])
      )
    )

  return populateLessons(upcomingLessons, group)
}
