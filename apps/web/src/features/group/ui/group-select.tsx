"use client"

import { GroupSelectItem } from "@/features/group/ui/group-select-item"
import { RecentGroups } from "@/widgets/recent-groups"
import type { groups } from "drizzle/schema"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { getGroupType } from "shared/groups/get-group-type"
import { transformFullNameToInitials } from "shared/groups/transform-full-name-to-initials"
import { isInsensitiveMatch } from "shared/is-insensitive-match"

const listGroups = ["higher", "college", "teacher"]

export type GroupSelectProps = {
  placeholderInput?: string
  groups: (typeof groups.$inferSelect)[]
  onSelect?: (group: typeof groups.$inferSelect) => void
}

export const GroupSelect = (props: GroupSelectProps) => {
  const t = useTranslations("select-group")

  const [value, setValue] = useState("")
  const filteredGroups =
    value.length > 0
      ? props.groups.filter(({ displayName }) =>
          isInsensitiveMatch(displayName, value)
        )
      : []

  return (
    <div className="flex flex-col gap-4">
      <input
        id="focusInput"
        value={value}
        onChange={({ target: { value } }) => setValue(value)}
        className="bg-neutral-3 border border-neutral-6 rounded-lg px-2 py-1"
        placeholder={props.placeholderInput ?? t("placeholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            filteredGroups[0]?.id && props.onSelect?.(filteredGroups[0])
          }
        }}
      />

      {value.length > 0 &&
        filteredGroups.map((group) => (
          <GroupSelectItem
            key={group.id}
            name={
              group.isTeacher
                ? transformFullNameToInitials(group.displayName)
                : group.displayName
            }
            onClick={() => props.onSelect?.(group)}
          />
        ))}

      {value.length === 0 && (
        <div className="flex gap-2">
          <RecentGroups
            groups={props.groups}
            onSelect={(group) => props.onSelect?.(group)}
          />
        </div>
      )}

      {value.length === 0 &&
        listGroups.map((listGroup) => (
          <div key={listGroup} className="flex flex-col gap-2">
            <h3 children={t(`groups.${listGroup}`)} />
            <div className="flex flex-wrap gap-2">
              {props.groups
                .filter((group) => getGroupType(group) === listGroup)
                .map((group) => (
                  <GroupSelectItem
                    key={group.id}
                    name={
                      group.isTeacher
                        ? transformFullNameToInitials(group.displayName)
                        : group.displayName
                    }
                    onClick={() => props.onSelect?.(group)}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  )
}
