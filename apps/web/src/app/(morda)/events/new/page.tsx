"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { PageTitle } from "@/shared/ui/page-title"

import { EventForm, type EventFormValues } from "../_ui/event-form"

export default function NewEventPage() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (data: EventFormValues) => {
		setError(null)
		try {
			await orpc.events.createEvent.call({
				title: data.title,
				description: data.description || null,
				coverImage: data.coverImage || null,
				groupsRegex: data.groupsRegex || null,
				date: new Date(`${data.date}T${data.time}`).toISOString(),
				buttonUrl: data.buttonUrl || null,
				buttonText: data.buttonText || null,
			})

			queryClient.invalidateQueries({
				queryKey: orpc.events.getAllEvents.queryKey(),
			})

			router.replace("/events")
		} catch {
			setError("Не удалось создать событие")
		}
	}

	return (
		<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
			<PageTitle title="Новое событие" />
			<EventForm
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
