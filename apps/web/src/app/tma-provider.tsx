"use client"

import { init } from "@tma.js/sdk-react"
import { type ReactNode, useEffect } from "react"

export const TmaProvider = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		try {
			init()
		} catch (error) {
			console.log("Failed to initialize TMA SDK", error)
		}
	}, [])

	return children
}
