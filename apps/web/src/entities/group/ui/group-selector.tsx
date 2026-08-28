import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { isInsensitiveMatch } from "@repo/shared/is-insensitive-match"

import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

type GroupSelectorProps = {
	onChange: (groupId: number, groupName: string) => void
	onBlur?: () => void
	noAbsolutePosition?: boolean
}

export const GroupSelector = ({
	onChange,
	onBlur,
	noAbsolutePosition,
}: GroupSelectorProps) => {
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))

	const searchItems = useMemo<SearchInputItem<number>[]>(() => {
		if (!groups.data) return []
		return groups.data.map((group) => ({
			key: group.id,
			value: group.displayName,
		}))
	}, [groups.data])

	const handleChange = (groupId: number) => {
		const group = searchItems.find((item) => item.key === groupId)
		if (!group) return

		onChange(groupId, group.value)
	}

	return (
		<SearchInput
			placeholder="Введите название группы"
			items={searchItems}
			filterFn={(item, query) => isInsensitiveMatch(item.value, query)}
			onChange={handleChange}
			maxSuggestions={searchItems.length}
			onBlur={onBlur}
			autoFocus
			noAbsolutePosition={noAbsolutePosition}
		/>
	)
}
