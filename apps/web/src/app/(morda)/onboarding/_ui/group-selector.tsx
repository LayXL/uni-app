"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { isInsensitiveMatch } from "@repo/shared/is-insensitive-match"

import { LottiePlayer } from "@/shared/ui/lottie"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

export const GroupSelector = () => {
	const router = useRouter()
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))

	const handleGroupClick = async (groupId: number) => {
		await orpc.users.updateUserGroup.call({ groupId })
		router.push("/")
	}

	const searchItems = useMemo<SearchInputItem<number>[]>(() => {
		if (!groups.data) return []
		return groups.data.map((group) => ({
			key: group.id,
			value: group.displayName,
		}))
	}, [groups.data])

	return (
		<div className="flex flex-col gap-4 pt-4">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer src="duck-wave" className="w-40 h-40 self-center" />
				<h2 className="text-center text-xl font-bold">Давай знакомиться!</h2>
				<p className="text-center text-sm text-muted text-balance">
					Выбери группу, чтобы расписание всегда было под крылом!
				</p>
			</div>
			<SearchInput
				placeholder="Введите название группы"
				className=""
				items={searchItems}
				filterFn={(item, query) => isInsensitiveMatch(item.value, query)}
				onChange={handleGroupClick}
				autoFocus
			/>
		</div>
	)
}
