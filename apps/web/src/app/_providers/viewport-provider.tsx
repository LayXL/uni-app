"use client"

import { useSignal, viewport } from "@tma.js/sdk-react"
import dynamic from "next/dynamic"
import { type ReactNode, useEffect } from "react"

type ViewportProviderProps = {
	children: ReactNode
}

const ViewportProviderComponent = ({ children }: ViewportProviderProps) => {
	const isAvailable = useSignal(viewport.mount.isAvailable)

	useEffect(() => {
		if (!isAvailable) {
			return
		}

		viewport.mount()

		viewport.requestFullscreen()
	}, [isAvailable])

	return children
}

export const ViewportProvider = dynamic(
	() => Promise.resolve(ViewportProviderComponent),
	{ ssr: false },
) as typeof ViewportProviderComponent
