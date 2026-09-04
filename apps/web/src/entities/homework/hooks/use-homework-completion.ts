import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

export const homeworkCompletionOptions = (queryClient: QueryClient) =>
	orpc.homeworks.toggleCompletion.mutationOptions({
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: orpc.homeworks.key() }),
	})

export function useHomeworkCompletion(id: string, completed: boolean) {
	const queryClient = useQueryClient()
	const mutation = useMutation(homeworkCompletionOptions(queryClient))
	const isCompleted = mutation.isPending
		? (mutation.variables?.completed ?? completed)
		: completed

	return {
		isCompleted,
		isPending: mutation.isPending,
		toggle: () => {
			if (mutation.isPending) return
			mutation.mutate({ homeworkId: id, completed: !isCompleted })
		},
	}
}
