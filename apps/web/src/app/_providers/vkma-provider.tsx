"use client"

import bridge from "@vkontakte/vk-bridge"
import { type ReactNode, useEffect } from "react"

export const VkmaProvider = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		bridge.send("VKWebAppInit")
	}, [])

	return children
}
