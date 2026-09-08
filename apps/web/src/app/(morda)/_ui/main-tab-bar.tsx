"use client"

import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { motion, useReducedMotion } from "motion/react"
import { useRef } from "react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { analytics } from "@/shared/lib/analytics"
import { Icon } from "@/shared/ui/icon"
import { cn } from "@/shared/utils/cn"
import { haptic } from "@/shared/utils/haptic"
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
	const navigate = useNavigate()
	const pressedTab = useRef<Tab["href"] | null>(null)
	const pathname = useLocation({ select: (location) => location.pathname })
	const shouldReduceMotion = useReducedMotion()
	const isRouteActive = useRouteBuilder((state) => state.isActive)
	const isMainPage = tabs.some((tab) => tab.href === pathname)
	const isMapRouteActive = pathname === "/map" && isRouteActive
	const currentTabIndex = tabs.findIndex((tab) => tab.href === pathname)
	const currentTab = tabs[currentTabIndex]

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
				className="fixed right-[max(0.75rem,var(--safe-area-inset-right))] bottom-[calc(var(--safe-area-inset-bottom)+0.75rem)] left-[max(0.75rem,var(--safe-area-inset-left))] isolate z-40 mx-auto max-w-lg rounded-[1.75rem] border border-border px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
			>
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 rounded-[inherit] bg-background/90 backdrop-blur-xl"
				/>
				<div className="relative isolate mx-auto grid h-(--tab-bar-height) max-w-lg grid-cols-3 gap-1 py-1.5">
					<motion.span
						aria-hidden="true"
						className="pointer-events-none absolute inset-y-1.5 left-0 z-0 w-[calc((100%-0.5rem)/3)] rounded-[1.375rem] bg-accent/10"
						initial={false}
						animate={{
							x: `calc(${currentTabIndex * 100}% + ${currentTabIndex * 0.25}rem)`,
						}}
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
					{/* Keep each tab composited even when the moving highlight is elsewhere. */}
					{tabs.map((tab) => {
						const isActive = pathname === tab.href
						const trackClick = () => {
							if (!currentTab) return

							analytics.track("tab_bar_clicked", {
								tab: tab.id,
								previous_tab: currentTab.id,
							})
						}

						return (
							<Link
								key={tab.href}
								to={tab.href}
								aria-current={isActive ? "page" : undefined}
								onPointerDown={(event) => {
									pressedTab.current = null
									if (
										!event.isPrimary ||
										event.button !== 0 ||
										event.metaKey ||
										event.ctrlKey ||
										event.shiftKey ||
										event.altKey
									)
										return

									pressedTab.current = tab.href
									haptic("light")
									trackClick()
									void navigate({ to: tab.href })
								}}
								onClick={(event) => {
									const wasPressed = pressedTab.current === tab.href
									pressedTab.current = null
									if (event.detail > 0 && wasPressed) {
										event.preventDefault()
										return
									}

									haptic("light")
									trackClick()
								}}
								className={cn(
									"relative z-10 grid min-w-0 cursor-pointer transform-gpu grid-rows-[24px_12px] content-center justify-items-center gap-1 rounded-[1.375rem] text-[10px] leading-3 font-medium text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
									isActive && "text-accent",
								)}
							>
								<Icon
									name={isActive ? tab.activeIcon : tab.inactiveIcon}
									size={24}
								/>
								<span className="max-w-full truncate px-1">{tab.label}</span>
							</Link>
						)
					})}
				</div>
			</nav>
		</>
	)
}
