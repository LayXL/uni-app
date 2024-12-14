"use client"

import { GroupSelectItem } from "@/features/group/ui/group-select-item"
import { useCloudStorage } from "@/shared/utils/use-cloud-storage"
import type { groups } from "drizzle/schema"
import { transformFullNameToInitials } from "shared/groups/transform-full-name-to-initials"

type RecentGroupsProps = {
  groups: (typeof groups.$inferSelect)[]
  onSelect: (group: typeof groups.$inferSelect) => void
}

export const RecentGroups = (props: RecentGroupsProps) => {
  const [recentGroups] = useCloudStorage<number[]>("recentGroups", [])

  if (recentGroups.data?.length === 0) return null

  return recentGroups.data?.map((id) => {
    const group = props.groups.find((group) => group.id === id)

    return group ? (
      <GroupSelectItem
        key={id}
        name={
          group.isTeacher
            ? transformFullNameToInitials(group.displayName)
            : group.displayName
        }
        onClick={() => props.onSelect(group)}
      />
    ) : null
  })
}
