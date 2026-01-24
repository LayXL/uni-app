"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import superjson from "superjson"

import { isTelegram } from "../utils/is-telegram"

type CloudStorageApi = {
	getItem: (
		key: string,
		callback?: (error: string | null, value?: string) => void,
	) => string | null | undefined | Promise<string | null | undefined>
	setItem: (
		key: string,
		value: string,
		callback?: (error: string | null) => void,
	) => Promise<void> | undefined
}

const getCloudStorage = (): CloudStorageApi | null => {
	if (typeof window === "undefined") return null
	const webApp = (window as unknown as { Telegram?: { WebApp?: unknown } })
		.Telegram?.WebApp
	if (!webApp || typeof webApp !== "object") return null
	return (webApp as { CloudStorage?: CloudStorageApi }).CloudStorage ?? null
}

const getCloudItem = async (key: string): Promise<string | null> => {
	const cloudStorage = getCloudStorage()
	if (!cloudStorage) return null

	if (cloudStorage.getItem.length >= 2) {
		return new Promise((resolve, reject) => {
			cloudStorage.getItem(key, (error, value) => {
				if (error) {
					reject(new Error(error))
					return
				}
				resolve(value ?? null)
			})
		})
	}

	const value = await Promise.resolve(cloudStorage.getItem(key))
	return value ?? null
}

const setCloudItem = async (key: string, value: string): Promise<void> => {
	const cloudStorage = getCloudStorage()
	if (!cloudStorage) return

	if (cloudStorage.setItem.length >= 3) {
		return new Promise((resolve, reject) => {
			cloudStorage.setItem(key, value, (error) => {
				if (error) {
					reject(new Error(error))
					return
				}
				resolve()
			})
		})
	}

	await Promise.resolve(cloudStorage.setItem(key, value))
}

export const useCloudStorage = <T>(
	key: string,
	defaultValue: T,
): [T | undefined, (value: T) => void] => {
	const queryClient = useQueryClient()
	const queryKey = ["cloud-storage", key]

	const { data } = useQuery({
		queryKey,
		enabled: isTelegram,
		queryFn: async () => {
			const raw = await getCloudItem(key)
			if (!raw) return defaultValue
			return superjson.parse<T>(raw)
		},
	})

	const mutation = useMutation({
		mutationFn: async (value: T) => {
			const raw = superjson.stringify(value)
			await setCloudItem(key, raw)
			return value
		},
		onMutate: (value) => {
			queryClient.setQueryData(queryKey, value)
		},
	})

	return [data, mutation.mutate]
}
