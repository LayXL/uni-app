import { LessonCard } from "@/features/lesson/ui/lesson-card"
import { addDays } from "date-fns/addDays"
import { formatISO } from "date-fns/formatISO"
import { subDays } from "date-fns/subDays"
import Link from "next/link"
import { getDailyLessons } from "shared/lessons/get-daily-lessons"

type PageProps = { params: Promise<{ group: string; date: string }> }

export default async function Page({ params }: PageProps) {
  const { date, group } = await params

  const schedule = await getDailyLessons(date, Number(group))

  return (
    <div>
      <div className="pt-4 px-4 flex justify-between">
        <Link
          prefetch={true}
          href={`/apps/web/src/app/(app)/schedule/${group}/${formatISO(subDays(date, 1), { representation: "date" })}`}
          children={"Prev"}
        />
        <Link
          prefetch={true}
          href={`/apps/web/src/app/(app)/schedule/${group}/${formatISO(addDays(date, 1), { representation: "date" })}`}
          children={"Next"}
        />
      </div>
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
    </div>
  )
}
