"use client"

import { useUser } from "@/entities/user/hooks/useUser"
import { MapEditor } from "@/features/map-editor/ui/map-editor"
import { PageTitle } from "@/shared/ui/page-title"

export default function MapEditorPage() {
	const user = useUser()

	if (!user.isAdmin) {
		return (
			<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
				<PageTitle title="Редактирование карты" />
				<p className="text-muted">Доступно только администраторам.</p>
			</div>
		)
	}

	return <MapEditor />
}
