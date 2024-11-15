import { LessonCard } from "@/feature/lesson/ui/lesson-card"
import { db } from "drizzle"
import { and, arrayContains, eq, inArray } from "drizzle-orm"
import { classes, groups, subjects } from "drizzle/schema"

const getSchedule = async (date: string, group: number) => {
  const schedule = await db
    .select()
    .from(classes)
    .where(and(eq(classes.date, date), arrayContains(classes.groups, [group])))

  const linkedGroups = await db
    .select()
    .from(groups)
    .where(
      inArray(
        groups.id,
        schedule.flatMap((item) => item.groups)
      )
    )

  const linkedSubjects = await db
    .select()
    .from(subjects)
    .where(
      inArray(
        subjects.id,
        schedule.map((item) => item.subject)
      )
    )

  return schedule.map((item) => ({
    ...item,
    subject: linkedSubjects.find(({ id }) => id === item.subject)?.name ?? "",
    groups: item.groups
      .map((id) => linkedGroups.find((group) => group.id === id))
      .filter((x) => x?.id !== group)
      .filter((x) => x !== undefined),
  }))
}

type PageProps = {
  params: Promise<{
    group: string
    date: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { date, group } = await params

  const schedule = await getSchedule(date, Number(group))

  return (
    <div className="p-4 flex flex-col gap-3">
      {schedule.map((item) => (
        <LessonCard
          key={item.order + item.subject + item.classroom}
          order={item.order}
          subject={item.subject}
          classroom={item.classroom}
          teacherNames={item.groups
            .filter(({ isTeacher }) => isTeacher)
            .map(({ displayName }) => displayName.replace(/\s\(.+\)/, ""))}
          groupNames={item.groups
            .filter(({ isTeacher }) => !isTeacher)
            .map(({ displayName }) => displayName)}
        />
      ))}
    </div>
  )
}
