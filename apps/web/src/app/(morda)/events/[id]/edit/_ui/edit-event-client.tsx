"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { EventCard } from "@/entities/event/ui/event-card"
import { PageTitle } from "@/shared/ui/page-title"

import { EventForm, type EventFormValues } from "../../../_ui/event-form"

type EditEventClientProps = {
	id: number
}

type EventPreview = {
	id: number
	title: string
	description?: string | null
	coverImage?: string | null
	backgroundColor?: string | null
	borderColor?: string | null
	textColor?: string | null
	buttonColor?: string | null
	date: string | Date
	buttonUrl?: string | null
	buttonText?: string | null
}

export default function EditEventClient({ id }: EditEventClientProps) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [error, setError] = useState<string | null>(null)
	const [preview, setPreview] = useState<EventPreview | null>(null)

	const { data: events } = useSuspenseQuery(
		orpc.events.getAllEvents.queryOptions({}),
	)

	const event = useMemo(() => events.find((e) => e.id === id), [events, id])

	useEffect(() => {
		if (!event) return
		setPreview({
			id: event.id,
			title: event.title,
			description: event.description,
			coverImage: event.coverImage,
			backgroundColor: event.backgroundColor,
			borderColor: event.borderColor,
			textColor: event.textColor,
			buttonColor: event.buttonColor,
			date: event.date,
			buttonUrl: event.buttonUrl,
			buttonText: event.buttonText,
		})
	}, [event])

	const handlePreviewChange = useCallback(
		(data: EventFormValues) => {
			if (!event) return
			const date = new Date(`${data.date}T${data.time}`)
			const nextPreview: EventPreview = {
				id: event.id,
				title: data.title,
				description: data.description || null,
				coverImage: data.coverImage || null,
				backgroundColor: data.backgroundColor || null,
				borderColor: data.borderColor || null,
				textColor: data.textColor || null,
				buttonColor: data.buttonColor || null,
				date: Number.isNaN(date.getTime()) ? event.date : date.toISOString(),
				buttonUrl: data.buttonUrl || null,
				buttonText: data.buttonText || null,
			}
			setPreview((prev) => {
				if (JSON.stringify(prev) === JSON.stringify(nextPreview)) {
					return prev
				}
				return nextPreview
			})
		},
		[event],
	)

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
				backgroundColor: data.backgroundColor || null,
				borderColor: data.borderColor || null,
				textColor: data.textColor || null,
				buttonColor: data.buttonColor || null,
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
			<div className="mb-4">
				<EventCard
					id={preview?.id ?? event.id}
					title={preview?.title ?? event.title}
					description={preview?.description ?? event.description}
					coverImage={preview?.coverImage ?? event.coverImage}
					backgroundColor={preview?.backgroundColor ?? event.backgroundColor}
					borderColor={preview?.borderColor ?? event.borderColor}
					textColor={preview?.textColor ?? event.textColor}
					buttonColor={preview?.buttonColor ?? event.buttonColor}
					date={preview?.date ?? event.date}
					buttonUrl={preview?.buttonUrl ?? event.buttonUrl}
					buttonText={preview?.buttonText ?? event.buttonText}
					hideEditButton
				/>
			</div>
			<EventForm
				defaultValues={{
					title: event.title,
					description: event.description ?? "",
					coverImage: event.coverImage ?? "",
					backgroundColor: event.backgroundColor ?? "",
					borderColor: event.borderColor ?? "",
					textColor: event.textColor ?? "",
					buttonColor: event.buttonColor ?? "",
					groupsRegex: event.groupsRegex ?? "",
					date: format(eventDate, "yyyy-MM-dd"),
					time: format(eventDate, "HH:mm"),
					buttonUrl: event.buttonUrl ?? "",
					buttonText: event.buttonText ?? "",
				}}
				onValuesChange={handlePreviewChange}
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
