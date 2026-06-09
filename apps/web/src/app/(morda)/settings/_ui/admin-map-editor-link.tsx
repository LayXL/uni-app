"use client"

import Link from "next/link"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const AdminMapEditorLink = () => {
	const user = useUser()

	if (!user.isAdmin) return null

	return (
		<Button
			asChild
			variant="secondary"
			leftIcon="iconify:material-symbols:map-outline"
			label="Редактирование карты"
		>
			<Link href="/settings/map" />
		</Button>
	)
}
