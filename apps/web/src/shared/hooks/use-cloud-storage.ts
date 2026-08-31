"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import bridge from "@vkontakte/vk-bridge"
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

const getLocalItem = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

const setLocalItem = (key: string, value: string) => {
	try {
		window.localStorage.setItem(key, value)
	} catch {
		// Ignore write failures (quota exceeded, private mode, etc).
	}
}

const getTelegramCloudItem = async (
	cloudStorage: CloudStorageApi,
	key: string,
): Promise<string | null> => {
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

const setTelegramCloudItem = async (
	cloudStorage: CloudStorageApi,
	key: string,
	value: string,
): Promise<void> => {
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

const getCloudItem = async (key: string): Promise<string | null> => {
	const cloudStorage = getCloudStorage()
	if (cloudStorage) {
		try {
			return await getTelegramCloudItem(cloudStorage, key)
		} catch {
			return getLocalItem(key)
		}
	}

	if (!isTelegram() && bridge.isEmbedded()) {
		try {
			const { keys } = await bridge.send("VKWebAppStorageGet", {
				keys: [key],
			})
			return keys.find((item) => item.key === key)?.value || null
		} catch {
			return getLocalItem(key)
		}
	}

	return getLocalItem(key)
}

const setCloudItem = async (key: string, value: string): Promise<void> => {
	const cloudStorage = getCloudStorage()
	if (cloudStorage) {
		try {
			await setTelegramCloudItem(cloudStorage, key, value)
			return
		} catch {
			setLocalItem(key, value)
			return
		}
	}

	if (!isTelegram() && bridge.isEmbedded()) {
		try {
			await bridge.send("VKWebAppStorageSet", { key, value })
			return
		} catch {
			setLocalItem(key, value)
			return
		}
	}

	setLocalItem(key, value)
}

export const useCloudStorage = <T>(
	key: string,
	defaultValue: T,
): [T | undefined, (value: T) => void] => {
	const queryClient = useQueryClient()
	const queryKey = ["cloud-storage", key]

	const { data } = useQuery({
		queryKey,
		enabled: typeof window !== "undefined",
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
