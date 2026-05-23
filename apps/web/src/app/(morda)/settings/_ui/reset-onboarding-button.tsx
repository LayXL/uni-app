"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const ResetOnboardingButton = () => {
	const user = useUser()
	const router = useRouter()
	const queryClient = useQueryClient()
	const [isPending, setIsPending] = useState(false)

	if (!user.isAdmin) return null

	return (
		<Button
			variant="secondary"
			disabled={isPending}
			leftIcon="iconify:material-symbols:restart-alt"
			onClick={async () => {
				setIsPending(true)

				try {
					await orpc.users.updateUserGroup.call({ groupId: null })
					await queryClient.invalidateQueries({
						queryKey: orpc.users.me.queryKey(),
					})

					router.replace("/onboarding")
				} finally {
					setIsPending(false)
				}
			}}
			label={isPending ? "Сбрасываем..." : "Сбросить онбординг"}
		/>
	)
}
