import assert from "node:assert/strict"
import { test } from "node:test"
import {
	MutationObserver,
	QueryClient,
	type QueryKey,
	QueryObserver,
} from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { homeworkCompletionOptions } from "./use-homework-completion"

const id = "homework-1"
const listKey: QueryKey = orpc.homeworks.getHomeworks.queryKey()
const groupListKey: QueryKey = orpc.homeworks.getHomeworks.queryKey({
	input: { group: 123 },
})
const detailKey: QueryKey = orpc.homeworks.getHomework.queryKey({
	input: { id },
})

for (const activeKey of [listKey, groupListKey, detailKey]) {
	test(`completion refreshes the active query and invalidates other homework caches: ${JSON.stringify(activeKey)}`, async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { staleTime: Infinity, retry: false } },
		})
		const keys = [listKey, groupListKey, detailKey]
		for (const key of keys)
			queryClient.setQueryData(key, { isCompleted: false })
		queryClient.setQueryData(["unrelated"], "unchanged")

		let completed = false
		const observer = new QueryObserver(queryClient, {
			queryKey: activeKey,
			queryFn: async () => ({ isCompleted: completed }),
		})
		const unsubscribe = observer.subscribe(() => {})
		const mutation = new MutationObserver(queryClient, {
			...homeworkCompletionOptions(queryClient),
			mutationFn: async (input) => {
				completed = input.completed
				return { completed }
			},
		})

		try {
			for (const next of [true, false]) {
				await mutation.mutate({ homeworkId: id, completed: next })
				assert.deepEqual(queryClient.getQueryData(activeKey), {
					isCompleted: next,
				})
				assert.equal(mutation.getCurrentResult().isPending, false)
				for (const key of keys.filter((key) => key !== activeKey)) {
					assert.equal(queryClient.getQueryState(key)?.isInvalidated, true)
				}
			}
			assert.equal(
				queryClient.getQueryState(["unrelated"])?.isInvalidated,
				false,
			)
		} finally {
			unsubscribe()
			queryClient.clear()
		}
	})
}

test("a failed completion refreshes server state and exits the pending state", async () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: Infinity, retry: false } },
	})
	queryClient.setQueryData(detailKey, { isCompleted: false })
	let refetches = 0
	const observer = new QueryObserver(queryClient, {
		queryKey: detailKey,
		queryFn: async () => {
			refetches++
			return { isCompleted: false }
		},
	})
	const unsubscribe = observer.subscribe(() => {})
	const mutation = new MutationObserver(queryClient, {
		...homeworkCompletionOptions(queryClient),
		mutationFn: async () => {
			throw new Error("Completion failed")
		},
	})

	try {
		await assert.rejects(
			mutation.mutate({ homeworkId: id, completed: true }),
			/Completion failed/,
		)
		assert.equal(refetches, 1)
		assert.deepEqual(queryClient.getQueryData(detailKey), {
			isCompleted: false,
		})
		assert.equal(mutation.getCurrentResult().isPending, false)
		assert.equal(mutation.getCurrentResult().isError, true)
	} finally {
		unsubscribe()
		queryClient.clear()
	}
})
