"use client"

import { useEffect } from "react"

import { useUser } from "@/entities/user/hooks/useUser"
import { setYandexMetrikaUserId } from "@/shared/lib/analytics/adapters/yandex-metrika"

export function YandexMetrikaUser() {
	const user = useUser()

	useEffect(() => {
		if (!user.isGuest) setYandexMetrikaUserId(String(user.id))
	}, [user.id, user.isGuest])

	return null
}
