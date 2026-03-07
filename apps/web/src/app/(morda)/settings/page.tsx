import { PageTitle } from "@/shared/ui/page-title"

import { DebugResetUserGroupButton } from "./_ui/debug-reset-user-group-button"

export default function SettingsPage() {
	return (
		<div className="p-4 pt-[calc(var(--tg-viewport-safe-area-inset-top)+1rem)] flex flex-col">
			<PageTitle title="Настройки" />
			{process.env.NODE_ENV === "development" && <DebugResetUserGroupButton />}
		</div>
	)
}
