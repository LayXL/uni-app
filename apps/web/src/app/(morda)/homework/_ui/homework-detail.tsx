"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import type { HomeworkFile } from "@/entities/homework/types"
import { FileList } from "@/entities/homework/ui/file-list"
import { useUser } from "@/entities/user/hooks/useUser"
import {
	HomeworkForm,
	type HomeworkFormValues,
} from "@/features/homework/ui/homework-form"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { PageTitle } from "@/shared/ui/page-title"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

type MetaBadgeProps = {
	icon: IconName
	iconClassName?: string
	children: React.ReactNode
}

function MetaBadge({ icon, iconClassName, children }: MetaBadgeProps) {
	return (
		<div className="relative bg-card rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
			<LiquidBorder />
			<Icon name={icon} size={16} className={iconClassName} />
			<span className="text-sm">{children}</span>
		</div>
	)
}

type HomeworkDetailProps = {
	id: string
}

export function HomeworkDetail({ id }: HomeworkDetailProps) {
	const user = useUser()
	const router = useRouter()
	const queryClient = useQueryClient()

	const { data: hw } = useSuspenseQuery(
		orpc.homeworks.getHomework.queryOptions({ input: { id } }),
	)

	const isAuthor = hw.author === user.id
	const [isEditing, setIsEditing] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [isCompleted, setIsCompleted] = useState(hw.isCompleted)

	const handleToggleComplete = async () => {
		const next = !isCompleted
		setIsCompleted(next)
		try {
			await orpc.homeworks.toggleCompletion.call({
				homeworkId: id,
				completed: next,
			})
			invalidate()
		} catch {
			setIsCompleted(!next)
		}
	}

	const handleDelete = async () => {
		if (!confirm("Удалить домашнее задание?")) return
		setIsDeleting(true)
		try {
			await orpc.homeworks.deleteHomework.call({ id })
			queryClient.invalidateQueries({
				queryKey: orpc.homeworks.getHomeworks.queryKey(),
			})
			router.replace("/homework")
		} catch {
			setIsDeleting(false)
		}
	}

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: orpc.homeworks.getHomework.queryKey({ input: { id } }),
		})
		queryClient.invalidateQueries({
			queryKey: orpc.homeworks.getHomeworks.queryKey(),
		})
	}

	if (isEditing && isAuthor) {
		const existingDeadline = format(new Date(hw.deadline), "yyyy-MM-dd")
		const extraSubjects =
			hw.subject?.id && hw.subject.name
				? [{ id: hw.subject.id, name: hw.subject.name }]
				: undefined

		const handleEdit = async (data: HomeworkFormValues) => {
			await orpc.homeworks.updateHomework.call({
				id: hw.id,
				subject: data.subject ?? null,
				deadline: new Date(`${data.deadline}T23:59:59`).toISOString(),
				title: data.title,
				description: data.description,
				files: data.files,
				isSharedWithWholeGroup: data.isSharedWithWholeGroup,
			})
			invalidate()
			setIsEditing(false)
		}

		return (
			<div className="p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
				<PageTitle title="Редактирование" />
				<HomeworkForm
					defaultValues={{
						subject: hw.subject?.id ?? undefined,
						title: hw.title,
						description: hw.description,
						deadline: existingDeadline,
						isSharedWithWholeGroup: hw.isSharedWithWholeGroup,
						files: hw.files as HomeworkFile[],
					}}
					extraSubjects={extraSubjects}
					onSubmit={handleEdit}
					submitLabel="Сохранить"
					submittingLabel="Сохранение..."
					onCancel={() => setIsEditing(false)}
				/>
			</div>
		)
	}

	const files = hw.files as HomeworkFile[]
	const deadline = new Date(hw.deadline)
	const authorName = !isAuthor
		? [hw.authorFirstName, hw.authorLastName].filter(Boolean).join(" ") || null
		: null

	return (
		<div className="flex flex-col pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)] px-4">
			<PageTitle
				title={hw.title}
				titleClassName={isCompleted && "line-through opacity-60"}
			/>

			<div className="flex flex-col gap-4">
				{hw.description && (
					<p className="text-sm whitespace-pre-wrap">{hw.description}</p>
				)}

				<Touchable>
					<button
						type="button"
						onClick={handleToggleComplete}
						className={cn(
							"relative bg-card rounded-3xl p-4 flex items-center gap-3",
							isCompleted && "opacity-80",
						)}
					>
						<LiquidBorder />
						<Icon
							name={
								isCompleted
									? "iconify:material-symbols:check-circle"
									: "iconify:material-symbols:circle-outline"
							}
							size={24}
							className={isCompleted ? "text-accent" : "text-muted"}
						/>
						<span className="text-sm">
							{isCompleted ? "Выполнено" : "Отметить как выполненное"}
						</span>
					</button>
				</Touchable>

				<div className="flex flex-wrap gap-2">
					{hw.subject?.name && (
						<MetaBadge
							icon="iconify:material-symbols:book-2-outline"
							iconClassName="text-muted"
						>
							{hw.subject.name}
						</MetaBadge>
					)}
					<MetaBadge
						icon="iconify:material-symbols:calendar-today"
						iconClassName="text-muted"
					>
						до {format(deadline, "d MMMM", { locale: ru })}
					</MetaBadge>
					{hw.isSharedWithWholeGroup && (
						<MetaBadge icon="iconify:material-symbols:group">
							Вся группа
						</MetaBadge>
					)}
					{authorName && (
						<MetaBadge icon="iconify:material-symbols:person-outline">
							{authorName}
						</MetaBadge>
					)}
				</div>

				<FileList files={files} />

				{isAuthor && (
					<div className="flex gap-2">
						<Button
							variant="secondary"
							label="Редактировать"
							onClick={() => setIsEditing(true)}
							className="flex-1"
						/>
						<Button
							variant="secondary"
							label={isDeleting ? "Удаление..." : "Удалить"}
							disabled={isDeleting}
							onClick={handleDelete}
							className="flex-1 text-destructive"
						/>
					</div>
				)}
			</div>
		</div>
	)
}
