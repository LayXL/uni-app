"use client"

import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import {
	HomeworkForm,
	type HomeworkFormValues,
} from "@/features/homework/ui/homework-form"
import { PageTitle } from "@/shared/ui/page-title"

export default function AddHomeworkPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (data: HomeworkFormValues) => {
		setError(null)
		try {
			const created = await orpc.homeworks.createHomework.call({
				date: format(new Date(), "yyyy-MM-dd"),
				...(data.subject !== undefined && { subject: data.subject }),
				deadline: new Date(`${data.deadline}T23:59:59`).toISOString(),
				title: data.title,
				description: data.description,
				files: data.files,
				isSharedWithWholeGroup: data.isSharedWithWholeGroup,
			})

			queryClient.invalidateQueries({
				queryKey: orpc.homeworks.getHomeworks.queryKey(),
			})

			router.replace(`/homework/${created.id}`)
		} catch {
			setError("Не удалось создать домашнее задание")
			throw error
		}
	}

	return (
		<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
			<PageTitle title="Новое домашнее задание" />
			<HomeworkForm
				onSubmit={handleSubmit}
				submitLabel="Создать"
				submittingLabel="Создание..."
			/>
			{error && (
				<div className="text-sm text-destructive text-center mt-2">{error}</div>
			)}
		</div>
	)
}
