import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import EditEventClient from "@/app/(morda)/events/[id]/edit/_ui/edit-event-client"
import { PageTitle } from "@/shared/ui/page-title"

export const Route = createFileRoute("/_app/events/$id/edit")({
	component: EditEventPage,
})

function EditEventPage() {
	const { id } = Route.useParams()
	const numericId = Number(id)

	if (!Number.isFinite(numericId)) {
		return (
			<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
				<PageTitle title="Событие не найдено" />
			</div>
		)
	}

	return (
		<Suspense fallback={null}>
			<EditEventClient id={numericId} />
		</Suspense>
	)
}
