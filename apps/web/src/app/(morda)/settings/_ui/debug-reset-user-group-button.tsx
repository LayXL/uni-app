"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const DebugResetUserGroupButton = () => {
	const user = useUser()
	const queryClient = useQueryClient()
	const router = useRouter()

	if (!user.isAdmin && process.env.NODE_ENV !== "development") return null

	return (
		<Button
			leftIcon="refresh-24"
			variant="secondary"
			onClick={async () => {
				await orpc.users.updateUserGroup.call({ groupId: null })

				queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() })

				router.replace("/onboarding")
			}}
			label="Сбросить группу"
		/>
	)
}
