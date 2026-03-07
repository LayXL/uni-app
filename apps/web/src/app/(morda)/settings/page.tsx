import { PageTitle } from "@/shared/ui/page-title"

import { AdminEventsLink } from "./_ui/admin-events-link"
import { DebugResetUserGroupButton } from "./_ui/debug-reset-user-group-button"

export default function SettingsPage() {
	return (
		<div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex flex-col gap-2 min-h-screen">
			<PageTitle title="Настройки" />
			<AdminEventsLink />
			{process.env.NODE_ENV === "development" && <DebugResetUserGroupButton />}
		</div>
	)
}
