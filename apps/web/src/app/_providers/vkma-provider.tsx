"use client"

import { type ReactNode, useEffect } from "react"

import bridge from "@/shared/lib/vk-bridge"

export const VkmaProvider = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		bridge.send("VKWebAppInit")
	}, [])

	return children
}
