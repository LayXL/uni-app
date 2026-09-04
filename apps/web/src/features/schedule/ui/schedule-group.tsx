"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"
import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"

import { GroupSelector } from "@/entities/group/ui/group-selector"
import { useLocalStorage } from "@/shared/hooks/use-local-storage"
import { analytics } from "@/shared/lib/analytics"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { usePopupClose } from "@/shared/ui/popup"
import { Portal } from "@/shared/ui/portal"
import { Touchable } from "@/shared/ui/touchable"

import { useScheduleGroup } from "../hooks/use-schedule-group"

export const ScheduleGroup = () => {
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))
	const { group, setGroup } = useScheduleGroup()

	const [isOpen, setIsOpen] = useState(false)
	const [viewedGroups, setViewedGroups] = useLocalStorage("viewedGroups")

	usePopupClose(isOpen, () => setIsOpen(false))

	const handleChange = (
		groupId: number,
		groupName: string,
		source: "schedule_search" | "schedule_recent",
	) => {
		const group = groups.data?.find((g) => g.id === groupId)
		if (!group) return

		analytics.track("group_selected", {
			group_id: groupId,
			group_name: groupName,
			source,
		})
		setGroup(group)
		setIsOpen(false)
		setViewedGroups((prev) => {
			const next = [...prev.filter((id) => id !== groupId), groupId]
			return next.slice(-10)
		})
	}

	return (
		<>
			<Touchable>
				<button
					type="button"
					className="relative min-w-26 bg-card rounded-3xl px-3 py-2"
					onClick={() => setIsOpen(!isOpen)}
				>
					<LiquidBorder />
					{group && transformFullNameToInitials(transformToGroupName(group))}
				</button>
			</Touchable>
			{isOpen && (
				<Portal>
					<div
						role="dialog"
						className="fixed inset-0 bg-background z-50 p-4 px-[max(1rem,calc((100%_-_var(--page-max-width))/2_+_1rem))] pt-[calc(var(--safe-area-inset-top)+1rem)] flex flex-col gap-4"
						onPointerDown={(event) => {
							if (event.target !== event.currentTarget) return
							setIsOpen(false)
						}}
					>
						<GroupSelector
							onChange={(groupId, groupName) =>
								handleChange(groupId, groupName, "schedule_search")
							}
							noAbsolutePosition
						/>
						<div className="-mx-4 overflow-x-auto overflow-y-hidden">
							<div className="flex w-max gap-2 px-4">
								{[...viewedGroups].reverse().map((groupId) => {
									const group = groups.data?.find((g) => g.id === groupId)
									if (!group) return null

									return (
										<Touchable key={groupId}>
											<button
												type="button"
												onClick={() =>
													handleChange(
														groupId,
														group.displayName,
														"schedule_recent",
													)
												}
												className="bg-card relative rounded-3xl px-3 py-2"
											>
												<LiquidBorder />
												<span>
													{transformFullNameToInitials(
														transformToGroupName(group),
													)}
												</span>
											</button>
										</Touchable>
									)
								})}
							</div>
						</div>
					</div>
				</Portal>
			)}
		</>
	)
}
