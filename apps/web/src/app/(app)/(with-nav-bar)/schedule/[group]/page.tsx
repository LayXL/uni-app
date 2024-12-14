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
      <Link prefetch href="/select-group" children="Select group" />
      {Object.entries(groupedUpcomingLessons).map(([date, lessons]) => (
        <Fragment key={date}>
          <p className="px-4 pt-2 text-lg font-medium" children={date} />
          {lessons?.map(({ classroom, groups, order, subject }) => (
            <LessonCard
              key={[order, subject, classroom].join("-")}
              order={order}
              subject={subject}
              classroom={classroom}
              teacherNames={groups
                .filter(checkIsTeacher)
                .map(transformToGroupName)}
              groupNames={groups.filter(checkIsGroup).map(transformToGroupName)}
            />
          ))}
        </Fragment>
      ))}
    </div>
  )
}
