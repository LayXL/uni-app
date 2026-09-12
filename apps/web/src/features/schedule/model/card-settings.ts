"use client"

import {
	useMutation,
	useMutationState,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import {
	type CardSettings,
	defaultCardSettings,
} from "@repo/shared/lessons/card-settings"

import { useUser } from "@/entities/user/hooks/useUser"

export type { CardSettings } from "@repo/shared/lessons/card-settings"

export const useCardSettings = () => {
	const user = useUser()
	const queryClient = useQueryClient()
	const queryKey = [...orpc.users.getCardSettings.queryKey(), user.id]
	const mutationKey = [...orpc.users.updateCardSettings.mutationKey(), user.id]
	const pendingPatches = useMutationState({
		filters: { mutationKey, status: "pending" },
		select: (mutation) => mutation.state.variables as Partial<CardSettings>,
	})
	const query = useQuery({
		...orpc.users.getCardSettings.queryOptions(),
		queryKey,
	})
	const mutation = useMutation({
		mutationKey,
		scope: { id: JSON.stringify(mutationKey) },
		mutationFn: (patch: Partial<CardSettings>) =>
			orpc.users.updateCardSettings.call(patch),
		onMutate: () => queryClient.cancelQueries({ queryKey }),
		onSuccess: (settings) => {
			queryClient.setQueryData(queryKey, settings)
		},
	})
	// Keep queued edits visible when an earlier save updates the cache.
	const settings = { ...(query.data ?? defaultCardSettings) }
	for (const patch of pendingPatches) {
		Object.assign(settings, patch)
	}

	return {
		...settings,
		isLoading: query.isPending,
		isSaving: pendingPatches.length > 0,
		error: query.isError
			? "Не удалось загрузить настройки. Попробуйте ещё раз."
			: mutation.isError
				? "Не удалось сохранить настройку. Попробуйте ещё раз."
				: null,
		retry: () => {
			mutation.reset()
			void query.refetch()
		},
		setSetting: <K extends keyof CardSettings>(
			key: K,
			value: CardSettings[K],
		) => {
			if (!query.data) return
			mutation.mutate({ [key]: value })
		},
	}
}
