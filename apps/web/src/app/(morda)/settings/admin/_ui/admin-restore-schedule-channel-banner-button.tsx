"use client"

import { useUser } from "@/entities/user/hooks/useUser"
import { SCHEDULE_CHANNEL_BANNER_HIDDEN_AT_STORAGE_KEY } from "@/shared/config/storage-keys"
import { useCloudStorage } from "@/shared/hooks/use-cloud-storage"
import { Button } from "@/shared/ui/button"

export const AdminRestoreScheduleChannelBannerButton = () => {
	const user = useUser()
	const [hiddenAt, setHiddenAt] = useCloudStorage<number | null>(
		SCHEDULE_CHANNEL_BANNER_HIDDEN_AT_STORAGE_KEY,
		null,
	)

	if (!user.isAdmin) return null

	const isLoading = hiddenAt === undefined
	const isHidden = hiddenAt != null

	return (
		<section className="relative flex flex-col gap-3 rounded-3xl bg-card p-4">
			<div>
				<h2 className="font-medium">Рекламный баннер</h2>
				<p className="text-sm text-muted">
					Вернуть скрытый баннер Telegram-канала в расписание
				</p>
			</div>
			<Button
				label={isHidden ? "Вернуть баннер" : "Баннер уже показывается"}
				leftIcon="refresh-24"
				size="sm"
				variant="secondary"
				disabled={isLoading || !isHidden}
				onClick={() => setHiddenAt(null)}
			/>
		</section>
	)
}
