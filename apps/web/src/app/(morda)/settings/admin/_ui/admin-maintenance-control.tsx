"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"
import { FormField } from "@/shared/ui/form-field"
import { Toggle } from "@/shared/ui/toggle"

export function AdminMaintenanceControl() {
	const user = useUser()
	const queryClient = useQueryClient()
	const { data: maintenance } = useSuspenseQuery(
		orpc.system.getMaintenance.queryOptions(),
	)
	const [enabled, setEnabled] = useState(maintenance.enabled)
	const [title, setTitle] = useState(maintenance.title)
	const [description, setDescription] = useState(maintenance.description)
	const [isSaving, setIsSaving] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [hasError, setHasError] = useState(false)

	if (!user.isAdmin) return null

	const trimmedTitle = title.trim()
	const trimmedDescription = description.trim()
	const isInvalid = trimmedTitle.length === 0 || trimmedDescription.length === 0
	const isDirty =
		enabled !== maintenance.enabled ||
		trimmedTitle !== maintenance.title ||
		trimmedDescription !== maintenance.description

	const clearMessage = () => setMessage(null)

	const handleSave = async () => {
		if (isInvalid || !isDirty) return

		setIsSaving(true)
		setMessage(null)
		setHasError(false)

		try {
			const updated = await orpc.system.updateMaintenance.call({
				enabled,
				title: trimmedTitle,
				description: trimmedDescription,
			})

			setEnabled(updated.enabled)
			setTitle(updated.title)
			setDescription(updated.description)
			queryClient.setQueryData(orpc.system.getMaintenance.queryKey(), updated)
			setMessage("Настройки экрана сохранены")
		} catch {
			setHasError(true)
			setMessage("Не удалось сохранить настройки. Попробуйте ещё раз.")
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<section className="relative flex flex-col gap-4 rounded-3xl bg-card p-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="font-medium">Технические шоколадки</h2>
					<p className="text-sm text-muted">
						Показывать экран работ всем пользователям
					</p>
				</div>
				<Toggle
					value={enabled}
					onChange={(value) => {
						setEnabled(value)
						clearMessage()
					}}
					ariaLabel="Показывать экран технических работ"
				/>
			</div>

			<FormField label="Заголовок" card>
				<input
					type="text"
					value={title}
					onChange={(event) => {
						setTitle(event.target.value)
						clearMessage()
					}}
					placeholder="Технические шоколадки"
					maxLength={120}
					className="w-full rounded-3xl bg-card p-3 outline-none placeholder:text-muted"
				/>
			</FormField>

			<FormField label="Описание" card>
				<textarea
					value={description}
					onChange={(event) => {
						setDescription(event.target.value)
						clearMessage()
					}}
					placeholder="Когда приложение снова заработает"
					maxLength={500}
					rows={3}
					className="w-full resize-none rounded-3xl bg-card p-3 outline-none placeholder:text-muted"
				/>
			</FormField>

			<Button
				label={isSaving ? "Сохраняем…" : "Сохранить экран"}
				variant="secondary"
				size="sm"
				disabled={isSaving || isInvalid || !isDirty}
				onClick={() => void handleSave()}
			/>

			{isInvalid ? (
				<p className="text-sm text-destructive">
					Заполните заголовок и описание
				</p>
			) : message ? (
				<p
					className={
						hasError ? "text-sm text-destructive" : "text-sm text-muted"
					}
				>
					{message}
				</p>
			) : null}
		</section>
	)
}
