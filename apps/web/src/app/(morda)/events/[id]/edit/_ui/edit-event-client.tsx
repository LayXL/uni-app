"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { PageTitle } from "@/shared/ui/page-title"

import { EventForm, type EventFormValues } from "../../../_ui/event-form"

type EditEventClientProps = {
	id: number
}

export default function EditEventClient({ id }: EditEventClientProps) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [error, setError] = useState<string | null>(null)

	const { data: events } = useSuspenseQuery(
		orpc.events.getAllEvents.queryOptions({}),
	)

	const event = useMemo(() => events.find((e) => e.id === id), [events, id])

	if (!event) {
		return (
			<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
				<PageTitle title="Событие не найдено" />
			</div>
		)
	}

	const eventDate = new Date(event.date)

	const handleSubmit = async (data: EventFormValues) => {
		setError(null)
		try {
			await orpc.events.updateEvent.call({
				id,
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
			setError("Не удалось обновить событие")
		}
	}

	return (
		<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
			<PageTitle title="Редактирование" />
			<EventForm
				defaultValues={{
					title: event.title,
					description: event.description ?? "",
					coverImage: event.coverImage ?? "",
					groupsRegex: event.groupsRegex ?? "",
					date: format(eventDate, "yyyy-MM-dd"),
					time: format(eventDate, "HH:mm"),
					buttonUrl: event.buttonUrl ?? "",
					buttonText: event.buttonText ?? "",
				}}
				onSubmit={handleSubmit}
				submitLabel="Сохранить"
				submittingLabel="Сохранение..."
				onCancel={() => router.back()}
			/>
			{error && (
				<div className="text-sm text-destructive text-center mt-2">{error}</div>
			)}
		</div>
	)
}
