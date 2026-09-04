"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"
import { useConfirmDialog } from "@/shared/ui/confirm-dialog"

type SyncResult = Awaited<ReturnType<typeof orpc.groups.syncGroups.call>>

const getResultMessage = (result: SyncResult) => {
	const changes = [
		result.created > 0 && `добавлено: ${result.created}`,
		result.updated > 0 && `переименовано: ${result.updated}`,
		result.restored > 0 && `восстановлено: ${result.restored}`,
		result.deactivated > 0 && `скрыто: ${result.deactivated}`,
	].filter(Boolean)

	return changes.length > 0
		? `Готово. Всего групп: ${result.total}; ${changes.join("; ")}.`
		: `Готово. Список из ${result.total} групп уже актуален.`
}

export const AdminSyncGroupsButton = () => {
	const user = useUser()
	const queryClient = useQueryClient()
	const confirm = useConfirmDialog()
	const [isSyncing, setIsSyncing] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [hasError, setHasError] = useState(false)

	if (!user.isAdmin) return null

	const handleSync = async () => {
		const confirmed = await confirm({
			title: "Синхронизировать группы с Bitrix?",
			description:
				"Новые группы появятся в списке, а отсутствующие в Bitrix будут скрыты.",
			confirmLabel: "Синхронизировать",
		})

		if (!confirmed) return

		setIsSyncing(true)
		setMessage(null)
		setHasError(false)

		try {
			const result = await orpc.groups.syncGroups.call()

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: orpc.groups.getAllGroups.queryKey(),
				}),
				queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() }),
			])

			setMessage(getResultMessage(result))
		} catch {
			setHasError(true)
			setMessage("Не удалось синхронизировать группы. Попробуйте ещё раз.")
		} finally {
			setIsSyncing(false)
		}
	}

	return (
		<div className="relative bg-card rounded-3xl p-4 flex flex-col gap-3">
			<div>
				<p className="font-medium">Группы</p>
				<p className="text-sm text-muted">
					Обновить список студентов и преподавателей из Bitrix
				</p>
			</div>
			<Button
				label={isSyncing ? "Синхронизация…" : "Синхронизировать группы"}
				leftIcon="sync-outline-28"
				size="sm"
				variant="secondary"
				disabled={isSyncing}
				onClick={handleSync}
			/>
			{message && (
				<p
					className={
						hasError ? "text-sm text-destructive" : "text-sm text-muted"
					}
				>
					{message}
				</p>
			)}
		</div>
	)
}
