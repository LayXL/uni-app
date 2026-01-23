"use client"

import { useQueryClient } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { Button } from "@/shared/ui/button"

export const DebugResetUserGroupButton = () => {
	const queryClient = useQueryClient()

	return (
		<div className="p-2 grid">
			<Button
				variant="secondary"
				onClick={async () => {
					await orpc.users.updateUserGroup.call({ groupId: null })

					queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() })
				}}
				label="Сбросить группу"
			/>
		</div>
	)
}
