"use client"

import { themeParams, useSignal } from "@tma.js/sdk-react"
import { type ReactNode, useEffect } from "react"

type ThemeProviderComponent = {
	children: ReactNode
}

export const ThemeProviderComponent = ({
	children,
}: ThemeProviderComponent) => {
	const isAvailable = useSignal(themeParams.mount.isAvailable, () => false)

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		themeParams.mount()
		themeParams.bindCssVars()
	}, [isAvailable])

	return children
}
