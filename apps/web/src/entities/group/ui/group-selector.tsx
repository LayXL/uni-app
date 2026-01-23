import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { isInsensitiveMatch } from "@repo/shared/is-insensitive-match"

import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

type GroupSelectorProps = {
	onChange: (groupId: number) => void
	onBlur?: () => void
}

export const GroupSelector = ({ onChange, onBlur }: GroupSelectorProps) => {
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))

	const searchItems = useMemo<SearchInputItem<number>[]>(() => {
		if (!groups.data) return []
		return groups.data.map((group) => ({
			key: group.id,
			value: group.displayName,
		}))
	}, [groups.data])

	return (
		<SearchInput
			placeholder="Введите название группы"
			items={searchItems}
			filterFn={(item, query) => isInsensitiveMatch(item.value, query)}
			onChange={onChange}
			maxSuggestions={searchItems.length}
			onBlur={onBlur}
			autoFocus
		/>
	)
}
