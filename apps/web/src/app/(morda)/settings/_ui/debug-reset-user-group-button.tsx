"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const DebugResetUserGroupButton = () => {
	const user = useUser()
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	if (!user.isAdmin && !import.meta.env.DEV) return null

	return (
		<Button
			leftIcon="refresh-24"
			variant="secondary"
			onClick={async () => {
				await orpc.users.updateUserGroup.call({ groupId: null })

				queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() })

				void navigate({ to: "/onboarding", replace: true })
			}}
			label="Сбросить группу"
		/>
	)
}
