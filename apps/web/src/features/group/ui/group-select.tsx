"use client"

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react"
import type { groups } from "drizzle/schema"

type GroupSelectProps = {
  groups: (typeof groups.$inferSelect)[]
}

export const GroupSelect = ({ groups }: GroupSelectProps) => {
  return (
    <Combobox
      immediate={true}
      // value={}
      virtual={{
        options: groups,
        // disabled: (person) => !person.available,
      }}
      // onChange={setSelectedPerson}
      // onClose={() => setQuery('')}
    >
      <ComboboxInput
        className={"w-full rounded-xl p-3 bg-neutral-3"}
        displayValue={(option) => option?.displayName}

        // onChange={(event) => setQuery(event.target.value)}
      />
      <ComboboxOptions
        anchor="bottom"
        className="w-[var(--input-width)] bg-neutral-3 border"
      >
        {({ option }) => (
          <ComboboxOption value={option} children={option.displayName} />
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
