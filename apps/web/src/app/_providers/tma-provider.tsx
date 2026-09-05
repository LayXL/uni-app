"use client"

import { init, setDebug } from "@tma.js/sdk-react"
import { type ReactNode, useEffect } from "react"

export const TmaProvider = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		try {
			try {
				init()
			} catch {}
			setDebug(import.meta.env.DEV)
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: tma sdk error
			console.log("Failed to initialize TMA SDK", error)
		}
	}, [])

	return children
}
