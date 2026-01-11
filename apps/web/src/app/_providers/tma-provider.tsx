"use client"

import { init, setDebug } from "@tma.js/sdk-react"
import { type ReactNode, useEffect } from "react"

export const TmaProvider = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		try {
			init()
			setDebug(process.env.NODE_ENV === "development")
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: tma sdk error
			console.log("Failed to initialize TMA SDK", error)
		}
	}, [])

	return children
}
