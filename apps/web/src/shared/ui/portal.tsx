"use client"

import { type ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"

type PortalProps = {
	children: ReactNode
}

export const Portal = ({ children }: PortalProps) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		return () => setMounted(false)
	}, [])

	if (!mounted) {
		return null
	}

	return createPortal(children, document.body)
}
