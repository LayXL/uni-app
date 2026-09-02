"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import { isVK } from "@/shared/utils/is-vk"

export function SettingsLink({ className }: { className?: string }) {
	const [isVkPlatform, setIsVkPlatform] = useState(false)

	useEffect(() => {
		setIsVkPlatform(isVK())
	}, [])

	if (!isVkPlatform) return null

	return (
		<Touchable>
			<Link
				href="/settings"
				aria-label="Настройки"
				className={cn(
					"size-8 grid shrink-0 place-items-center rounded-3xl border border-border bg-background",
					className,
				)}
			>
				<Icon name="settings-24" size={16} />
			</Link>
		</Touchable>
	)
}

export function SettingsButton() {
	return (
		<div className="fixed top-[calc(var(--safe-area-inset-top)+0.75rem)] right-[calc(var(--safe-area-inset-right)+0.75rem)] z-10">
			<SettingsLink />
		</div>
	)
}
