"use client"

import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import superjson from "superjson"

const isBrowser = () => typeof window !== "undefined"

export interface LocalStorageKeyMap {
	viewedGroups: number[]
}

const localStorageDefaultValues: LocalStorageDefaultValueMap = {
	viewedGroups: [],
}

type KnownLocalStorageKey = Extract<keyof LocalStorageKeyMap, string>
export interface LocalStorageDefaultValueMap
	extends Partial<LocalStorageKeyMap> {
	viewedGroups: number[]
}

type KeyWithDefault = Extract<
	Extract<keyof LocalStorageDefaultValueMap, string>,
	KnownLocalStorageKey
>
const getDefaultValue = <K extends KeyWithDefault>(
	key: K,
): LocalStorageDefaultValueMap[K] => localStorageDefaultValues[key]

export function useLocalStorage<K extends KeyWithDefault>(
	key: K,
): [LocalStorageKeyMap[K], Dispatch<SetStateAction<LocalStorageKeyMap[K]>>] {
	const [storedValue, setStoredValue] = useState<LocalStorageKeyMap[K]>(() => {
		const fallbackValue = getDefaultValue(key) as LocalStorageKeyMap[K]

		if (!isBrowser()) return fallbackValue

		try {
			const item = window.localStorage.getItem(key)
			if (item === null) return fallbackValue

			return superjson.parse<LocalStorageKeyMap[K]>(item)
		} catch {
			return fallbackValue
		}
	})

	useEffect(() => {
		if (!isBrowser()) return

		try {
			window.localStorage.setItem(key, superjson.stringify(storedValue))
		} catch {
			// Ignore write failures (quota exceeded, private mode, etc).
		}
	}, [key, storedValue])

	return [storedValue, setStoredValue]
}
