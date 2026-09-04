import { createFileRoute } from "@tanstack/react-router"

import AdminSettingsPage from "@/app/(morda)/settings/admin/page"

export const Route = createFileRoute("/_app/settings/admin")({
	component: AdminSettingsPage,
})
