"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { GroupSelector } from "@/entities/group/ui/group-selector"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { usePopupClose } from "@/shared/ui/popup"
import { Portal } from "@/shared/ui/portal"
import { Touchable } from "@/shared/ui/touchable"

import { useScheduleGroup } from "../hooks/use-schedule-group"

export const ScheduleGroup = () => {
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))
	const { group, setGroup } = useScheduleGroup()

	const [isOpen, setIsOpen] = useState(false)

	usePopupClose(isOpen, () => setIsOpen(false))

	const handleChange = async (groupId: number) => {
		const group = groups.data?.find((g) => g.id === groupId)
		if (!group) return

		setGroup(group)
		setIsOpen(false)
	}

	return (
		<>
			<Touchable>
				<button
					type="button"
					className="relative w-26 bg-card rounded-3xl px-3 py-2"
					onClick={() => setIsOpen(!isOpen)}
				>
					<LiquidBorder />
					{group?.displayName}
				</button>
			</Touchable>
			{isOpen && (
				<Portal>
					<div className="fixed inset-0 bg-background z-50 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
						<GroupSelector
							onChange={handleChange}
							onBlur={() => setIsOpen(false)}
						/>
					</div>
				</Portal>
			)}
		</>
	)
}
