"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"

import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import { Button } from "@/shared/ui/button"
import { LiquidBorder } from "@/shared/ui/liquid-border"

export const SaveCurrentGroupAsUser = () => {
	const queryClient = useQueryClient()
	const [isOpen, setIsOpen] = useState(false)
	const { group, currentGroupIsUserGroup } = useScheduleGroup()

	useEffect(() => {
		setIsOpen(!currentGroupIsUserGroup && Boolean(group))
	}, [currentGroupIsUserGroup, group])

	if (!isOpen) return null

	return (
		<div className="px-2 pb-3">
			<div className="relative bg-card rounded-3xl p-4 flex flex-col gap-4">
				<LiquidBorder />
				<p className="text-sm">
					Ты сейчас смотришь расписание{" "}
					{group && (
						<span className="font-semibold">
							{transformFullNameToInitials(transformToGroupName(group))}
						</span>
					)}
					<br />
					Сохранить эту группу как свою?
				</p>
				<div className="grid grid-cols-2 gap-1">
					<Button
						variant="accent"
						size="sm"
						leftIcon="done-24"
						label="Сохранить"
						onClick={async () => {
							if (!group) {
								return
							}

							orpc.users.updateUserGroup.call({ groupId: group.id })
							await queryClient.invalidateQueries({
								queryKey: orpc.users.me.queryKey(),
							})
							setIsOpen(false)
						}}
					/>
					<Button
						variant="primary"
						size="sm"
						label="Нет, спасибо"
						onClick={() => setIsOpen(false)}
					/>
				</div>
			</div>
		</div>
	)
}
