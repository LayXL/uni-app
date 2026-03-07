"use client"

import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import superjson from "superjson"

const isBrowser = () => typeof window !== "undefined"

export interface LocalStorageKeyMap {
	viewedGroups: number[]
	onlyMyHomeworks: boolean
}

const localStorageDefaultValues: LocalStorageKeyMap = {
	viewedGroups: [],
	onlyMyHomeworks: false,
}

type LocalStorageKey = Extract<keyof LocalStorageKeyMap, string>

const getDefaultValue = <K extends LocalStorageKey>(
	key: K,
): LocalStorageKeyMap[K] => localStorageDefaultValues[key]

export function useLocalStorage<K extends LocalStorageKey>(
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
