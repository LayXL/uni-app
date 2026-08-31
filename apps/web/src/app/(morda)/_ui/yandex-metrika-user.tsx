"use client"

import { useEffect } from "react"

import { useUser } from "@/entities/user/hooks/useUser"
import { setYandexMetrikaUserId } from "@/shared/lib/analytics/adapters/yandex-metrika"

export function YandexMetrikaUser() {
	const user = useUser()

	useEffect(() => {
		setYandexMetrikaUserId(String(user.id))
	}, [user.id])

	return null
}
