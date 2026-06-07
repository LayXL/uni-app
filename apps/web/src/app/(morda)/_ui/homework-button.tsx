"use client"

import Link from "next/link"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { Button } from "@/shared/ui/button"

export function HomeworkButton() {
	const isNavigationActive = useRouteBuilder((state) => state.isActive)

	if (isNavigationActive) return null

	return (
		<div className="fixed bottom-4 mb-(--safe-area-inset-bottom) right-4 z-10">
			<Button asChild leftIcon="iconify:material-symbols:assignment">
				<Link href="/homework" />
			</Button>
		</div>
	)
}
