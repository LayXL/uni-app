import { Navigate } from "@tanstack/react-router"

import { useUser } from "@/entities/user/hooks/useUser"
import { PageTitle } from "@/shared/ui/page-title"

import { AdminEventsLink } from "./_ui/admin-events-link"
import { AdminMaintenanceControl } from "./_ui/admin-maintenance-control"
import { AdminMapEditorLink } from "./_ui/admin-map-editor-link"
import { AdminPremiumLink } from "./_ui/admin-premium-link"
import { AdminRestoreScheduleChannelBannerButton } from "./_ui/admin-restore-schedule-channel-banner-button"
import { AdminSyncGroupsButton } from "./_ui/admin-sync-groups-button"
import { DebugResetUserGroupButton } from "./_ui/debug-reset-user-group-button"
import { DebugTimeOffsetControl } from "./_ui/debug-time-offset-control"
import { RestoreUserFeedbackButton } from "./_ui/restore-user-feedback-button"

export default function AdminSettingsPage() {
	const user = useUser()

	if (!user.isAdmin) return <Navigate to="/settings" replace />

	return (
		<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] flex flex-col gap-2 min-h-screen pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
			<PageTitle title="Администрирование" />
			<AdminMaintenanceControl />
			<AdminEventsLink />
			<AdminMapEditorLink />
			<AdminPremiumLink />
			<AdminSyncGroupsButton />
			<AdminRestoreScheduleChannelBannerButton />
			<RestoreUserFeedbackButton />
			<DebugTimeOffsetControl />
			<DebugResetUserGroupButton />
		</div>
	)
}
