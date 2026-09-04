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
		return groups.data.map((group) => {
			const teacherName =
				group.type === "teacher"
					? group.displayName.match(/^(.+?)\s*\((.+)\)\s*$/)
					: null

			return {
				key: group.id,
				value: teacherName ? teacherName[1].trim() : group.displayName,
				description: teacherName?.[2].trim(),
			}
		})
	}, [groups.data])

	const handleChange = (groupId: number) => {
		const group = groups.data?.find((item) => item.id === groupId)
		if (!group) return

		onChange(groupId, group.displayName)
	}

	return (
		<SearchInput
			placeholder="Введите название группы"
			items={searchItems}
			filterFn={(item, query) =>
				isInsensitiveMatch(
					item.description ? `${item.value} (${item.description})` : item.value,
					query,
				)
			}
			onChange={handleChange}
			maxSuggestions={searchItems.length}
			onBlur={onBlur}
			autoFocus
			noAbsolutePosition={noAbsolutePosition}
		/>
	)
}
