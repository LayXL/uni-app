import { DebugResetUserGroupButton } from "./_ui/debug-reset-user-group-button"

export default function SettingsPage() {
	return (
		<div className="p-4 pt-[calc(var(--tg-viewport-safe-area-inset-top)+1rem)] flex flex-col gap-2">
			<DebugResetUserGroupButton />
		</div>
	)
}
