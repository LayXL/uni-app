import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useReducedMotion } from "motion/react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { LottiePlayer } from "@/shared/ui/lottie"
import { Toggle } from "@/shared/ui/toggle"

export function NotificationSettings() {
	const user = useUser()
	const queryClient = useQueryClient()
	const reducedMotion = useReducedMotion()
	const mutation = useMutation({
		mutationFn: (enabled: boolean) =>
			orpc.users.updateNotifications.call({ enabled }),
		onSuccess: (updated) => {
			queryClient.setQueryData(
				orpc.users.me.queryKey(),
				(current: typeof user | undefined) =>
					current ? { ...current, ...updated } : current,
			)
		},
	})

	return (
		<section className="flex flex-col gap-6" aria-label="Уведомления">
			<div className="flex h-24 items-center justify-center">
				{reducedMotion ? (
					<span className="text-6xl">🔔</span>
				) : (
					<LottiePlayer src="bell" className="h-24 w-24" />
				)}
			</div>
			<div className="relative rounded-3xl bg-card p-4">
				<LiquidBorder />
				<div
					className="flex items-center justify-between gap-4"
					aria-busy={mutation.isPending}
				>
					<div className="min-w-0">
						<h2 className="font-medium">Уведомления</h2>
						<p className="mt-1 text-sm text-muted">
							Присылать расписание на день
						</p>
					</div>
					<Toggle
						value={
							mutation.isPending
								? mutation.variables
								: user.isEnabledNotifications
						}
						onChange={(enabled) => mutation.mutate(enabled)}
						disabled={mutation.isPending}
						ariaLabel="Уведомления о расписании"
						className="shrink-0"
					/>
				</div>
				{mutation.isError ? (
					<p role="alert" className="mt-3 text-sm text-destructive">
						Не удалось сохранить настройку. Попробуйте ещё раз.
					</p>
				) : null}
			</div>
		</section>
	)
}
