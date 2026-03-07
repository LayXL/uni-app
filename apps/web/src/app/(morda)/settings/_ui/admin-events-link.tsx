"use client"

import Link from "next/link"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"

export const AdminEventsLink = () => {
	const user = useUser()

	if (!user.isAdmin) return null

	return (
		<Button
			asChild
			variant="secondary"
			leftIcon="iconify:material-symbols:event-outline"
			label="Управление событиями"
		>
			<Link href="/events" />
		</Button>
	)
}
