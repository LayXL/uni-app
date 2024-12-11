"use client"

import { GroupSelectItem } from "@/features/group/ui/group-select-item"
import type { groups } from "drizzle/schema"
import { useState } from "react"
import { getGroupType } from "shared/groups/get-group-type"

const listGroups = ["higher", "college", "teacher"]

export type GroupSelectProps = {
  groups: (typeof groups.$inferSelect)[]
  onSelect?: (group: typeof groups.$inferSelect) => void
}

const transformGroupName = (name: string) =>
  name.toLocaleLowerCase().replace(/\s|-|\//g, "")

export const GroupSelect = (props: GroupSelectProps) => {
  const [searchValue, setSearchValue] = useState("")
  const filteredGroups =
    searchValue.length > 0
      ? props.groups.filter(({ displayName }) =>
          transformGroupName(displayName).includes(
            transformGroupName(searchValue)
          )
        )
      : []

  return (
    <div className="flex flex-col gap-4">
      <input
        value={searchValue}
        onChange={({ target: { value } }) => setSearchValue(value)}
        className="bg-neutral-3 border border-neutral-6 rounded-lg px-2 py-1"
        placeholder="Placeholder"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            filteredGroups[0]?.id && props.onSelect?.(filteredGroups[0])
          }
        }}
      />

      {searchValue.length > 0 &&
        filteredGroups.map((group) => (
          <GroupSelectItem
            key={group.id}
            name={group.displayName}
            onClick={() => props.onSelect?.(group)}
          />
        ))}

      {searchValue.length === 0 &&
        listGroups.map((listGroup) => (
          <div key={listGroup} className="flex flex-col gap-2">
            <h3>{listGroup}</h3>
            <div className="flex flex-wrap gap-2">
              {props.groups
                .filter((group) => getGroupType(group) === listGroup)
                .map((group) => (
                  <GroupSelectItem
                    key={group.id}
                    name={group.displayName}
                    onClick={() => props.onSelect?.(group)}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  )
}
