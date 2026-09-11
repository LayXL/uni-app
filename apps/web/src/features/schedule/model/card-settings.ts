"use client"

import {
	useIsMutating,
	useMutation,
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
	const isSaving = useIsMutating({ mutationKey }) > 0
	const query = useQuery({
		...orpc.users.getCardSettings.queryOptions(),
		queryKey,
	})
	const mutation = useMutation({
		mutationKey,
		mutationFn: (patch: Partial<CardSettings>) =>
			orpc.users.updateCardSettings.call(patch),
		onMutate: async (patch) => {
			await queryClient.cancelQueries({ queryKey })
			const previous = queryClient.getQueryData<CardSettings>(queryKey)
			queryClient.setQueryData(queryKey, { ...previous, ...patch })
			return { previous }
		},
		onSuccess: (settings) => {
			queryClient.setQueryData(queryKey, settings)
		},
		onError: (_error, _patch, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous)
			}
		},
	})

	return {
		...(query.data ?? defaultCardSettings),
		isLoading: query.isPending,
		isSaving,
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
			if (!query.data || isSaving) return
			mutation.mutate({ [key]: value })
		},
	}
}
