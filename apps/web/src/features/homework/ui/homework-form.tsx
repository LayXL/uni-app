"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

import type { HomeworkFile } from "@/entities/homework/types"
import { formatFileSize } from "@/entities/homework/types"
import { useFileUpload } from "@/features/homework/hooks/use-file-upload"
import { useSubjectItems } from "@/features/homework/hooks/use-subject-items"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { SearchInput } from "@/shared/ui/search-input"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

const formSchema = z.object({
	subject: z.number().optional(),
	title: z.string().min(1, "Введите название").max(255),
	description: z.string(),
	deadline: z.string().min(1, "Выберите дедлайн"),
	isSharedWithWholeGroup: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export type HomeworkFormValues = FormValues & { files: HomeworkFile[] }

type HomeworkFormProps = {
	defaultValues?: Partial<HomeworkFormValues>
	extraSubjects?: { id: number; name: string }[]
	onSubmit: (data: HomeworkFormValues) => Promise<void>
	submitLabel: string
	submittingLabel: string
	onCancel?: () => void
}

export function HomeworkForm({
	defaultValues,
	extraSubjects,
	onSubmit,
	submitLabel,
	submittingLabel,
	onCancel,
}: HomeworkFormProps) {
	const subjectItems = useSubjectItems(extraSubjects)

	const {
		files,
		fileInputRef,
		uploadingCount,
		isUploading,
		uploadError,
		selectFiles,
		removeFile,
		openFilePicker,
	} = useFileUpload(defaultValues?.files)

	const {
		control,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			subject: defaultValues?.subject,
			title: defaultValues?.title ?? "",
			description: defaultValues?.description ?? "",
			deadline: defaultValues?.deadline ?? "",
			isSharedWithWholeGroup: defaultValues?.isSharedWithWholeGroup ?? false,
		},
	})

	const onFormSubmit = handleSubmit(async (data) => {
		await onSubmit({ ...data, files })
	})

	const isLoading = isSubmitting || isUploading
	const formError =
		uploadError || errors.title?.message || errors.deadline?.message || null

	return (
		<div className="flex flex-col gap-4">
			<Controller
				control={control}
				name="subject"
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<span className="text-sm text-muted">Предмет</span>
						<SearchInput
							placeholder="Выберите предмет"
							items={subjectItems}
							value={field.value}
							onChange={field.onChange}
							maxSuggestions={subjectItems.length}
						/>
					</div>
				)}
			/>

			<Controller
				control={control}
				name="title"
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<span className="text-sm text-muted">
							Название <span className="text-destructive">*</span>
						</span>
						<div className="relative rounded-3xl">
							<LiquidBorder />
							<input
								type="text"
								placeholder="Напишите название"
								maxLength={255}
								className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted focus:ring-2 focus:ring-accent transition-shadow"
								{...field}
							/>
						</div>
					</div>
				)}
			/>

			<Controller
				control={control}
				name="description"
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<span className="text-sm text-muted">Описание</span>
						<div className="relative rounded-3xl">
							<LiquidBorder />
							<textarea
								placeholder="Опишите задание..."
								rows={4}
								className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted focus:ring-2 focus:ring-accent transition-shadow resize-none"
								{...field}
							/>
						</div>
					</div>
				)}
			/>

			<Controller
				control={control}
				name="deadline"
				render={({ field }) => (
					<div className="flex flex-col gap-1.5">
						<span className="text-sm text-muted">
							Дедлайн <span className="text-destructive">*</span>
						</span>
						<div className="relative rounded-3xl">
							<LiquidBorder />
							<input
								type="date"
								className="bg-card rounded-3xl p-3 w-full outline-none focus:ring-2 focus:ring-accent transition-shadow"
								{...field}
							/>
						</div>
					</div>
				)}
			/>

			<div className="flex flex-col gap-2">
				<span className="text-sm text-muted">Файлы</span>
				<Touchable>
					<button
						type="button"
						onClick={openFilePicker}
						className="border-2 border-dashed border-border rounded-3xl p-6 flex flex-col items-center gap-2 text-muted w-full"
					>
						<Icon name="iconify:material-symbols:upload-file" size={32} />
						<span className="text-sm">Нажмите, чтобы прикрепить файлы</span>
						<span className="text-xs">Изображения и документы до 5 МБ</span>
					</button>
				</Touchable>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
					onChange={(e) => selectFiles(e.target.files)}
					className="hidden"
				/>

				{uploadingCount > 0 && (
					<div className="text-sm text-muted animate-pulse">
						Загрузка файлов ({uploadingCount})...
					</div>
				)}

				{files.length > 0 && (
					<div className="flex flex-col gap-2">
						{files.map((file) => (
							<div
								key={file.key}
								className="relative bg-card rounded-2xl p-3 flex items-center gap-3"
							>
								<LiquidBorder />
								<Icon
									name="iconify:material-symbols:attach-file"
									size={20}
									className="text-muted shrink-0"
								/>
								<div className="flex-1 min-w-0">
									<div className="text-sm truncate">{file.name}</div>
									<div className="text-xs text-muted">
										{formatFileSize(file.size)}
									</div>
								</div>
								<Touchable>
									<button
										type="button"
										onClick={() => removeFile(file.key)}
										className="text-muted p-1"
									>
										<Icon
											name="iconify:material-symbols:close-rounded"
											size={20}
										/>
									</button>
								</Touchable>
							</div>
						))}
					</div>
				)}
			</div>

			<Controller
				control={control}
				name="isSharedWithWholeGroup"
				render={({ field }) => (
					<div className="relative bg-card rounded-3xl p-4 flex items-center justify-between">
						<LiquidBorder />
						<span className="text-sm">Поделиться со всей группой</span>
						<Touchable>
							<button
								type="button"
								onClick={() => field.onChange(!field.value)}
								className={cn(
									"relative w-12 h-7 rounded-full transition-colors",
									field.value ? "bg-accent" : "bg-border",
								)}
							>
								<div
									className={cn(
										"absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-sm",
										field.value ? "translate-x-[22px]" : "translate-x-0.5",
									)}
								/>
							</button>
						</Touchable>
					</div>
				)}
			/>

			{formError && (
				<div className="text-sm text-destructive text-center">{formError}</div>
			)}

			{onCancel ? (
				<div className="flex gap-2">
					<Button
						variant="secondary"
						label="Отмена"
						onClick={onCancel}
						className="flex-1"
					/>
					<Button
						label={isSubmitting ? submittingLabel : submitLabel}
						disabled={isLoading}
						onClick={onFormSubmit}
						className="flex-1"
					/>
				</div>
			) : (
				<Button
					label={isSubmitting ? submittingLabel : submitLabel}
					disabled={isLoading}
					onClick={onFormSubmit}
				/>
			)}
		</div>
	)
}
