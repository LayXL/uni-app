"use client"

import {
  GroupSelect,
  type GroupSelectProps,
} from "@/features/group/ui/group-select"
import { useCloudStorage } from "@/shared/utils/use-cloud-storage"
import type { groups } from "drizzle/schema"
import { useRef } from "react"

type ClientSelectGroupProps = {
  groups: (typeof groups.$inferSelect)[]
}

export default function ClientSelectGroup(props: ClientSelectGroupProps) {
  const [recentGroups, setRecentGroups] = useCloudStorage<number[]>(
    "recentGroups",
    []
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const onSelect: GroupSelectProps["onSelect"] = ({ id }) => {
    if (!inputRef.current) return
    inputRef.current.value = id.toString()

    setRecentGroups.mutate(
      [...new Set([id, ...(recentGroups.data ?? [])])].slice(0, 25)
    )

    const form = inputRef.current.parentElement as HTMLFormElement

    form.requestSubmit()
  }

  return (
    <>
      <input name="groupId" ref={inputRef} className="hidden" />
      <GroupSelect groups={props.groups} onSelect={onSelect} />
    </>
  )
}
