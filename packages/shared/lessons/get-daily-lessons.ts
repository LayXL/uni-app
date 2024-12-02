import { db } from "drizzle"
import { and, arrayContains, eq } from "drizzle-orm"
import { classes } from "drizzle/schema.ts"
import { populateLessons } from "./populate-lessons.ts"

export const getDailyLessons = async (date: string, group: number) => {
  const dailyLessons = await db
    .select()
    .from(classes)
    .where(and(eq(classes.date, date), arrayContains(classes.groups, [group])))
    .orderBy(classes.date, classes.order)

  return populateLessons(dailyLessons, group)
}
