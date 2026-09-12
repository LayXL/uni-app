import { useMutation, useQueryClient } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { analytics } from "@/shared/lib/analytics"
import { LottiePlayer } from "@/shared/ui/lottie"

import { GroupSelector } from "./group-selector"

export function GroupSelectionStep({
	onNext,
	source = "onboarding",
}: {
	onNext?: () => void
	source?: "onboarding" | "schedule_search"
}) {
	const queryClient = useQueryClient()
	const mutation = useMutation({
		mutationFn: async ({ groupId }: { groupId: number; groupName: string }) => {
			await orpc.users.updateUserGroup.call({ groupId })
			await queryClient.invalidateQueries({
				queryKey: orpc.users.me.queryKey(),
			})
		},
		onSuccess: (_, { groupId, groupName }) => {
			analytics.track("group_selected", {
				group_id: groupId,
				group_name: groupName,
				source,
			})
			if (source === "onboarding") {
				analytics.track("onboarding_completed", {
					group_id: groupId,
					group_name: groupName,
				})
			}
			onNext?.()
		},
	})

	return (
		<div className="flex flex-col gap-4 pt-4">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer
					src="duck-with-toy"
					className="w-40 h-40 self-center"
					disableFadeIn
					loop
				/>
				<h2 className="text-center text-xl font-bold">Давай знакомиться!</h2>
				<p className="text-center text-sm text-muted text-balance">
					Выбери группу, чтобы расписание всегда было под рукой
				</p>
			</div>
			<div inert={mutation.isPending} aria-busy={mutation.isPending}>
				<GroupSelector
					onChange={(groupId, groupName) =>
						mutation.mutate({ groupId, groupName })
					}
				/>
			</div>
			{mutation.isError && (
				<p role="alert" className="text-sm text-destructive">
					Не удалось сохранить группу. Попробуй ещё раз.
				</p>
			)}
		</div>
	)
}
