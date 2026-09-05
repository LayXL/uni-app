"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"
import { isTestingGroupId } from "@repo/shared/testing-group"

import {
	HomeworkForm,
	type HomeworkFormValues,
} from "@/features/homework/ui/homework-form"
import { HomeworkIntro } from "@/features/homework/ui/homework-intro"
import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import { BackButton } from "@/shared/ui/back-button"
import { isVK } from "@/shared/utils/is-vk"
import { getClientTestNow } from "@/shared/utils/test-time"

export default function AddHomeworkPage() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { group } = useScheduleGroup()
	const [error, setError] = useState<string | null>(null)
	const testingGroupId = isTestingGroupId(group?.id) ? group.id : undefined

	const handleSubmit = async (data: HomeworkFormValues) => {
		setError(null)
		try {
			const created = await orpc.homeworks.createHomework.call({
				date: format(getClientTestNow(), "yyyy-MM-dd"),
				...(data.subject !== undefined && { subject: data.subject }),
				deadline: new Date(`${data.deadline}T23:59:59`).toISOString(),
				title: data.title,
				description: data.description,
				files: data.files,
				isSharedWithWholeGroup: data.isSharedWithWholeGroup,
				...(testingGroupId !== undefined && { group: testingGroupId }),
			})

			queryClient.invalidateQueries({
				queryKey: orpc.homeworks.getHomeworks.queryKey(
					testingGroupId !== undefined
						? { input: { group: testingGroupId } }
						: {},
				),
			})

			void navigate({
				to: "/homework/$id",
				params: { id: created.id },
				replace: true,
			})
		} catch {
			setError("Не удалось создать домашнее задание")
			throw error
		}
	}

	return (
		<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
			{isVK() && <BackButton />}
			<HomeworkIntro />
			<HomeworkForm
				onSubmit={handleSubmit}
				submitLabel="Добавить домашку"
				submittingLabel="Добавление..."
			/>
			{error && (
				<div className="text-sm text-destructive text-center mt-2">{error}</div>
			)}
		</div>
	)
}
