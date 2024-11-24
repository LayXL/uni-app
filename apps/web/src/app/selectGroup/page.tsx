import { GroupSelect } from "@/features/group/ui/group-select"
import { db } from "drizzle"
import { asc } from "drizzle-orm"
import { groups } from "drizzle/schema"
import { transformToGroupName } from "shared/groups/transform-to-group-name"

export default async function Page() {
  const allGroups = await db
    .select()
    .from(groups)
    .orderBy(asc(groups.isTeacher), asc(groups.displayName))
    .then((groups) =>
      groups.map((group) => ({
        ...group,
        displayName: transformToGroupName(group),
      }))
    )

  return (
    <div className="p-4">
      <GroupSelect groups={allGroups} />
    </div>
  )
}
