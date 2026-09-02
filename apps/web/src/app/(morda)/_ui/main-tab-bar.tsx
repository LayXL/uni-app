"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { analytics } from "@/shared/lib/analytics"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

type Tab = {
	href: string
	label: string
	icon: IconName
	id: "schedule" | "map" | "homework"
}

const tabs: Tab[] = [
	{
		id: "schedule",
		href: "/",
		label: "Расписание",
		icon: "iconify:material-symbols:calendar-today",
	},
	{
		id: "map",
		href: "/map",
		label: "Карта",
		icon: "iconify:material-symbols:map-outline",
	},
	{
		id: "homework",
		href: "/homework",
		label: "Домашки",
		icon: "iconify:material-symbols:assignment",
	},
]

export function MainTabBar() {
	const pathname = usePathname()
	const isRouteActive = useRouteBuilder((state) => state.isActive)
	const isMainPage = tabs.some((tab) => tab.href === pathname)
	const isMapRouteActive = pathname === "/map" && isRouteActive
	const currentTab = tabs.find((tab) => tab.href === pathname)

	if (!isMainPage || isMapRouteActive) return null

	return (
		<nav
			aria-label="Основные разделы"
			className="fixed right-[max(0.75rem,var(--safe-area-inset-right))] bottom-[calc(var(--safe-area-inset-bottom)+0.75rem)] left-[max(0.75rem,var(--safe-area-inset-left))] z-40 mx-auto max-w-lg rounded-[1.75rem] border border-border bg-background/90 px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl"
		>
			<div className="mx-auto grid h-(--tab-bar-height) max-w-lg grid-cols-3 gap-1 py-1.5">
				{tabs.map((tab) => {
					const isActive = pathname === tab.href

					return (
						<Touchable key={tab.href}>
							<Link
								href={tab.href}
								aria-current={isActive ? "page" : undefined}
								onClick={() => {
									if (!currentTab) return

									analytics.track("tab_bar_clicked", {
										tab: tab.id,
										previous_tab: currentTab.id,
									})
								}}
								className={cn(
									"flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.375rem] text-[10px] leading-3 font-medium text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
									isActive && "bg-accent/10 text-accent",
								)}
							>
								<Icon name={tab.icon} size={23} />
								<span className="max-w-full truncate px-1">{tab.label}</span>
							</Link>
						</Touchable>
					)
				})}
			</div>
		</nav>
	)
}
