"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"

import { useAppVisit } from "./use-app-visit"

export const useScheduleSettingsHint = () => {
	const user = useUser()
	const visit = useAppVisit()
	const queryClient = useQueryClient()
	const queryKey = [...orpc.users.getHints.queryKey(), user.id, visit.sessionId]
	const hints = useQuery({
		...orpc.users.getHints.queryOptions(),
		queryKey,
		enabled: visit.isSuccess,
	})
	const dismiss = useMutation({
		...orpc.users.dismissScheduleSettingsHint.mutationOptions(),
		onSuccess: (data) => {
			queryClient.setQueryData(queryKey, data)
		},
	})
	return {
		visible: hints.data?.showScheduleSettings ?? false,
		isSaving: dismiss.isPending,
		error: dismiss.isError,
		dismiss: () => dismiss.mutate(undefined),
	}
}
