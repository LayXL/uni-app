import { Timer } from "@/features/countdown/ui/timer"
import { LessonCard } from "@/features/lesson/ui/lesson-card"
import { Link } from "@/shared/ui/link"
import cn, { hover } from "@/shared/utils/cn"
import { addMinutes } from "date-fns/addMinutes"
import { db } from "drizzle"
import { getTranslations } from "next-intl/server"
import { Fragment } from "react"
import { checkIsGroup } from "shared/groups/check-is-group"
import { checkIsTeacher } from "shared/groups/check-is-teacher"
import { transformFullNameToInitials } from "shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "shared/groups/transform-to-group-name"
import { getUpcomingLessons } from "shared/lessons/get-upcoming-lessons"

type PageProps = { params: Promise<{ groupId: string }> }

export default async function Page({ params }: PageProps) {
  const t = await getTranslations("schedule")

  const { groupId } = await params

  const group = await db.query.groups.findFirst({
    where: (groups, { eq }) => eq(groups.id, Number(groupId)),
  })

  if (!group) return null

  const groupName = transformToGroupName(group)

  const upcomingLessons = await getUpcomingLessons(Number(groupId))
  const groupedUpcomingLessons = Object.groupBy(
    upcomingLessons,
    ({ date }) => date
  )

  return (
    <div className="p-4 grid gap-3 sm:grid-cols-[1fr_2fr] items-start sm:h-full sm:overflow-hidden">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 items-center sm:flex-col sm:items-stretch">
          <p
            className="px-4 pt-2 text-lg font-medium flex-1 sm:flex-auto"
            children={t("title")}
          />

          <Link
            prefetch
            href="/select-group"
            className={cn(
              "block p-4 bg-neutral-2 rounded-xl transition-colors",
              hover("bg-neutral-4")
            )}
          >
            <p
              children={
                group.isTeacher
                  ? transformFullNameToInitials(groupName)
                  : groupName
              }
            />
          </Link>
        </div>

        <div className="p-4 bg-neutral-2 rounded-xl grid place-items-center">
          <Timer
            className="text-3xl font-semibold"
            endsAt={addMinutes(new Date(), 60)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:overflow-y-scroll sm:h-[calc(100%+32px)] sm:-my-4 sm:py-4">
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
                groupNames={groups
                  .filter(checkIsGroup)
                  .map(transformToGroupName)}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
