"use client"

import { backButton, useSignal } from "@tma.js/sdk-react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { type FC, type ReactNode, useEffect } from "react"

type BackButtonProviderProps = {
	children: ReactNode
}

const BackButtonProviderComponent = ({ children }: BackButtonProviderProps) => {
	const router = useRouter()
	const pathname = usePathname()

	const isAvailable = useSignal(backButton.mount.isAvailable)

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		backButton.mount()

		const offClick = backButton.onClick(() => {
			router.back()
		})

		return () => {
			backButton.unmount()
			offClick()
		}
	}, [router, isAvailable])

	useEffect(() => {
		const hasHistory = window.history.length > 0 && Boolean(pathname)

		if (hasHistory) {
			backButton.show.ifAvailable()
		} else {
			backButton.hide.ifAvailable()
		}
	}, [pathname])

	return children
}

export const BackButtonProvider = dynamic(
	() => Promise.resolve(BackButtonProviderComponent),
	{ ssr: false },
) as typeof BackButtonProviderComponent
