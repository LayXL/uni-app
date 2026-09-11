"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"
import { LiquidBorder } from "@/shared/ui/liquid-border"

export const ResetHintsButton = () => {
	const user = useUser()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const mutation = useMutation({
		...orpc.users.resetHints.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: orpc.users.getHints.queryKey(),
			})
			void navigate({ to: "/" })
		},
	})
	if (!user.isAdmin) return null
	return (
		<section className="relative flex flex-col gap-3 rounded-3xl bg-card p-4">
			<LiquidBorder />
			<div>
				<h2 className="font-medium">Подсказки</h2>
				<p className="text-sm text-muted">
					Снова показать подсказки для вашего аккаунта
				</p>
			</div>
			<Button
				label="Сбросить подсказки"
				leftIcon="refresh-24"
				size="sm"
				variant="secondary"
				disabled={mutation.isPending}
				onClick={() => mutation.mutate(undefined)}
			/>
			{mutation.isError && (
				<p role="alert" className="text-sm text-destructive">
					Не удалось сбросить подсказки. Попробуйте ещё раз.
				</p>
			)}
		</section>
	)
}
