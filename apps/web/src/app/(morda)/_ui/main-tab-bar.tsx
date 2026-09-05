"use client"

import { Link, useLocation } from "@tanstack/react-router"
import { motion, useReducedMotion } from "motion/react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { analytics } from "@/shared/lib/analytics"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

type Tab = {
	href: "/" | "/map" | "/homework"
	label: string
	activeIcon: IconName
	inactiveIcon: IconName
	id: "schedule" | "map" | "homework"
}

const tabs: Tab[] = [
	{
		id: "schedule",
		href: "/",
		label: "Расписание",
		activeIcon: "iconify:material-symbols:calendar-today",
		inactiveIcon: "iconify:material-symbols:calendar-today-outline",
	},
	{
		id: "map",
		href: "/map",
		label: "Карта",
		activeIcon: "iconify:material-symbols:map",
		inactiveIcon: "iconify:material-symbols:map-outline",
	},
	{
		id: "homework",
		href: "/homework",
		label: "Домашки",
		activeIcon: "iconify:material-symbols:assignment",
		inactiveIcon: "iconify:material-symbols:assignment-outline",
	},
]

export function MainTabBar() {
	const pathname = useLocation({ select: (location) => location.pathname })
	const shouldReduceMotion = useReducedMotion()
	const isRouteActive = useRouteBuilder((state) => state.isActive)
	const isMainPage = tabs.some((tab) => tab.href === pathname)
	const isMapRouteActive = pathname === "/map" && isRouteActive
	const currentTab = tabs.find((tab) => tab.href === pathname)

	if (!isMainPage || isMapRouteActive) return null

	return (
		<>
			<div
				aria-hidden="true"
				className={cn(
					"pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+2.25rem)] bg-linear-to-t to-transparent",
					pathname === "/map" ? "from-(--map-background)" : "from-background",
				)}
			/>
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
									to={tab.href}
									aria-current={isActive ? "page" : undefined}
									onClick={() => {
										if (!currentTab) return

										analytics.track("tab_bar_clicked", {
											tab: tab.id,
											previous_tab: currentTab.id,
										})
									}}
									className={cn(
										"relative isolate flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.375rem] text-[10px] leading-3 font-medium text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
										isActive && "text-accent",
									)}
								>
									{isActive && (
										<motion.span
											layoutId="main-tab-active-background"
											aria-hidden="true"
											className="pointer-events-none absolute inset-0 -z-10 rounded-[1.375rem] bg-accent/10"
											transition={
												shouldReduceMotion
													? { duration: 0 }
													: {
															type: "spring",
															stiffness: 500,
															damping: 38,
															mass: 0.7,
														}
											}
										/>
									)}
									<Icon
										name={isActive ? tab.activeIcon : tab.inactiveIcon}
										size={23}
									/>
									<span className="max-w-full truncate px-1">{tab.label}</span>
								</Link>
							</Touchable>
						)
					})}
				</div>
			</nav>
		</>
	)
}
