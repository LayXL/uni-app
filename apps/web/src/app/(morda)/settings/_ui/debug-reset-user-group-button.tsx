"use client"

import { useQueryClient } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const DebugResetUserGroupButton = () => {
	const user = useUser()
	const queryClient = useQueryClient()

	if (user.isAdmin) return null

	return (
		<Button
			variant="secondary"
			onClick={async () => {
				await orpc.users.updateUserGroup.call({ groupId: null })

				queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() })
			}}
			label="Сбросить группу"
		/>
	)
}
