"use client"
import { useField } from "@payloadcms/ui"

import type { TextFieldClientComponent } from "payload"
import type { ComponentProps } from "react"
import { transformToGroupName } from "shared/groups/transform-to-group-name"

type AfterInputGroupsProps = ComponentProps<TextFieldClientComponent> & {
  groups: string[]
}

const AfterInputGroups = (props: AfterInputGroupsProps) => {
  const field = useField({ path: props.path })

  const fieldValue = (field?.value as string[] | undefined) ?? []

  const filtered = []

  try {
    const regexp = new RegExp(fieldValue?.join("|"), "gi")

    for (const group of props.groups) {
      if (regexp.test(group)) {
        filtered.push(group)
      }
    }
  } catch (e) {}

  return (
    <div>
      <p>Оставьте пустым, если актуально для всех групп</p>
      <p>Или же вставьте подходящие значения в поле</p>
      <table>
        <tbody
          children={[
            ["^П", "для всех групп разработчиков"],
            ["^Д", "для всех групп дизайна"],
            ["-1\\d{2}", "для первого курса вышки"],
            ["-1\\d$", "для первого курса колледжа"],
            ["-3", "для всех третьих курсов"],
          ].map((row) => (
            <tr key={row[0]}>
              <td>{row[0]}</td>
              <td>{row[1]}</td>
            </tr>
          ))}
        />
      </table>
      <p style={{ paddingTop: 4 }}>
        <span style={{ paddingTop: 8 }}>
          Группы, которые соответствуют условиям:{" "}
        </span>
        {filtered.length === 0 && <span>Ничего не нашлось</span>}
        {filtered.length === props.groups.length && <span>Все группы</span>}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {filtered.length !== props.groups.length &&
          filtered.map((group) => (
            <span
              key={group}
              style={{
                padding: 4,
                borderRadius: 4,
                backgroundColor: "#f5f5f510",
                fontSize: 12,
              }}
              children={transformToGroupName({ displayName: group })}
            />
          ))}
      </div>
    </div>
  )
}

export default AfterInputGroups
