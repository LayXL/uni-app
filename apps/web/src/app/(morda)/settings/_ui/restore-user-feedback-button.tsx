"use client"

import { useRouter } from "next/navigation"

import { useUser } from "@/entities/user/hooks/useUser"
import { restoreUserFeedbackPrompt } from "@/features/schedule/lib/get-app-session-id"
import { Button } from "@/shared/ui/button"

export const RestoreUserFeedbackButton = () => {
	const router = useRouter()
	const user = useUser()

	if (!user.isAdmin) return null

	const handleRestore = () => {
		restoreUserFeedbackPrompt()
		router.push("/")
	}

	return (
		<section className="relative flex flex-col gap-3 rounded-3xl bg-card p-4">
			<div>
				<h2 className="font-medium">Обратная связь</h2>
				<p className="text-sm text-muted">
					Вернуть карточку оценки приложения в расписание
				</p>
			</div>
			<Button
				label="Вернуть виджет"
				leftIcon="refresh-24"
				size="sm"
				variant="secondary"
				onClick={handleRestore}
			/>
		</section>
	)
}
