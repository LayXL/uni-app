"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { isInsensitiveMatch } from "@repo/shared/is-insensitive-match"

import { Touchable } from "@/shared/ui/touchable"

export const GroupSelector = () => {
	const [groupName, setGroupName] = useState("")

	const router = useRouter()
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))

	const handleGroupClick = (groupId: number) => async () => {
		await orpc.users.updateUserGroup.call({ groupId })
		router.push("/")
	}

	const filteredGroups = useMemo(() => {
		if (!groups.data) return groups.data
		if (!groupName) return groups.data

		return groups.data.filter((group) =>
			isInsensitiveMatch(group.displayName, groupName),
		)
	}, [groups.data, groupName])

	const handleEnterPress = () => {
		if (!filteredGroups?.length) return

		void handleGroupClick(filteredGroups[0].id)()
	}

	return (
		<div className="flex flex-col gap-2">
			<input
				type="text"
				placeholder="Введите название группы"
				className="p-2 rounded-2xl bg-card border border-border"
				value={groupName}
				onChange={(e) => setGroupName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault()
						handleEnterPress()
					}
				}}
				autoFocus
			/>

			{filteredGroups?.map((group) => (
				<Touchable key={group.id}>
					<button
						type="button"
						className="p-2 rounded-2xl bg-card border border-border"
						onClick={handleGroupClick(group.id)}
					>
						{group.displayName}
					</button>
				</Touchable>
			))}
		</div>
	)
}
