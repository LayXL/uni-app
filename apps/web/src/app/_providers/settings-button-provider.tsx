"use client"

import { settingsButton, useSignal } from "@tma.js/sdk-react"
import { useRouter } from "next/navigation"
import { type ReactNode, useEffect } from "react"

type SettingsButtonProviderProps = {
	children: ReactNode
}

export const SettingsButtonProvider = ({
	children,
}: SettingsButtonProviderProps) => {
	const router = useRouter()

	const isAvailable = useSignal(settingsButton.mount.isAvailable, () => false)

	useEffect(() => {
		if (!isAvailable) return

		settingsButton.mount()
		settingsButton.show()

		const offClick = settingsButton.onClick(() => {
			router.push("/settings")
		})

		return () => {
			settingsButton.hide()
			settingsButton.unmount()
			offClick()
		}
	}, [isAvailable, router.push])

	return children
}
