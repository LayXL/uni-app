import { LessonCard } from "@/features/lesson/ui/lesson-card"
import Link from "next/link"
import { Fragment } from "react"
import { checkIsGroup } from "shared/groups/check-is-group"
import { checkIsTeacher } from "shared/groups/check-is-teacher"
import { transformToGroupName } from "shared/groups/transform-to-group-name"
import { getUpcomingLessons } from "shared/lessons/get-upcoming-lessons"

type PageProps = { params: Promise<{ group: string }> }

export default async function Page({ params }: PageProps) {
  const { group } = await params

  const upcomingLessons = await getUpcomingLessons(Number(group))
  const groupedUpcomingLessons = Object.groupBy(
    upcomingLessons,
    ({ date }) => date
  )

  return (
    <div className="p-4 flex flex-col gap-3">
      <div>
        <Link href="/select-group" children="Select group" />
      </div>
      {Object.entries(groupedUpcomingLessons).map(([date, lessons]) => (
        <Fragment key={date}>
          <div className="px-4 pt-2 text-lg font-medium">{date}</div>
          {lessons?.map((lesson) => {
            const key = `${lesson.order}-${lesson.subject}-${lesson.classroom}`

            const teachers = lesson.groups.filter(checkIsTeacher)
            const groups = lesson.groups.filter(checkIsGroup)

            return (
              <LessonCard
                key={key}
                order={lesson.order}
                subject={lesson.subject}
                classroom={lesson.classroom}
                teacherNames={teachers.map(transformToGroupName)}
                groupNames={groups.map(transformToGroupName)}
              />
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
