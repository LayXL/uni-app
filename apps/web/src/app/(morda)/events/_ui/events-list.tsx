"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

export function EventsList() {
	const queryClient = useQueryClient()
	const { data: events } = useSuspenseQuery(
		orpc.events.getAllEvents.queryOptions({}),
	)

	const [deletingId, setDeletingId] = useState<number | null>(null)

	const handleDelete = async (id: number) => {
		if (!confirm("Удалить событие?")) return
		setDeletingId(id)
		try {
			await orpc.events.deleteEvent.call({ id })
			queryClient.invalidateQueries({
				queryKey: orpc.events.getAllEvents.queryKey(),
			})
		} finally {
			setDeletingId(null)
		}
	}

	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 px-4">
				<Icon
					name="iconify:material-symbols:event-busy-outline"
					size={64}
					className="text-muted"
				/>
				<p className="text-center text-muted">Событий пока нет</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2 px-4">
			{events.map((event) => (
				<div
					key={event.id}
					className="relative bg-card rounded-3xl overflow-hidden"
				>
					<LiquidBorder />
					<div className="p-4 flex flex-col gap-2">
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 min-w-0">
								<h3 className="font-medium truncate">{event.title}</h3>
								<p className="text-sm text-muted">
									{format(new Date(event.date), "d MMMM yyyy, HH:mm", {
										locale: ru,
									})}
								</p>
							</div>
							<div className="flex gap-1 shrink-0">
								<Touchable>
									<Link
										href={`/events/${event.id}/edit`}
										className="p-2 text-muted"
									>
										<Icon
											name="iconify:material-symbols:edit-outline"
											size={20}
										/>
									</Link>
								</Touchable>
								<Touchable>
									<button
										type="button"
										onClick={() => handleDelete(event.id)}
										disabled={deletingId === event.id}
										className="p-2 text-destructive disabled:opacity-50"
									>
										<Icon
											name="iconify:material-symbols:delete-outline"
											size={20}
										/>
									</button>
								</Touchable>
							</div>
						</div>
						{event.description && (
							<p className="text-sm text-muted line-clamp-2">
								{event.description}
							</p>
						)}
						{event.groupsRegex && (
							<span className="text-xs text-muted font-mono bg-muted/10 rounded-lg px-2 py-1 self-start">
								{event.groupsRegex}
							</span>
						)}
					</div>
				</div>
			))}
		</div>
	)
}
