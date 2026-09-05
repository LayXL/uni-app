import { Link } from "@tanstack/react-router"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"
import { PageTitle } from "@/shared/ui/page-title"

import { NotificationSettings } from "./_ui/notification-settings"

export default function SettingsPage() {
	const user = useUser()

	return (
		<div className="flex min-h-screen flex-col gap-4 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
			<PageTitle title="Настройки" />
			<NotificationSettings />
			{user.isAdmin ? (
				<Button
					asChild
					variant="secondary"
					leftIcon="settings-outline-28"
					label="Администрирование"
				>
					<Link to="/settings/admin" />
				</Button>
			) : null}
		</div>
	)
}
