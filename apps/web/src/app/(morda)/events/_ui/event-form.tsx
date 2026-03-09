"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import z from "zod"

import { useCoverUpload } from "@/features/events/hooks/use-cover-upload"
import { Button } from "@/shared/ui/button"
import { FormField } from "@/shared/ui/form-field"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Toggle } from "@/shared/ui/toggle"
import { Touchable } from "@/shared/ui/touchable"

const colorHexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/
const optionalColorSchema = z
	.string()
	.refine((value) => value.length === 0 || colorHexRegex.test(value), {
		message: "Введите HEX-цвет, например #A1B2C3",
	})

const normalizeHexColor = (value: string) => {
	if (!value) return ""
	if (colorHexRegex.test(value)) return value.toUpperCase()
	return value
}

const formSchema = z.object({
	title: z.string().min(1, "Введите название").max(255),
	description: z.string().optional(),
	groupsRegex: z.string().optional(),
	backgroundColor: optionalColorSchema,
	borderColor: optionalColorSchema,
	textColor: optionalColorSchema,
	date: z.string().min(1, "Выберите дату"),
	time: z.string().min(1, "Выберите время"),
	buttonUrl: z.string().optional(),
	buttonText: z.string().max(255).optional(),
	allGroups: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export type EventFormValues = Omit<FormValues, "allGroups"> & {
	coverImage?: string
}

type EventFormProps = {
	defaultValues?: Partial<EventFormValues>
	onSubmit: (data: EventFormValues) => Promise<void>
	onValuesChange?: (data: EventFormValues) => void
	submitLabel: string
	submittingLabel: string
	onCancel?: () => void
}

export function EventForm({
	defaultValues,
	onSubmit,
	onValuesChange,
	submitLabel,
	submittingLabel,
	onCancel,
}: EventFormProps) {
	const {
		coverUrl,
		fileInputRef,
		isUploading,
		uploadError,
		selectFile,
		removeCover,
		openFilePicker,
	} = useCoverUpload(defaultValues?.coverImage)

	const {
		control,
		handleSubmit,
		watch,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: defaultValues?.title ?? "",
			description: defaultValues?.description ?? "",
			groupsRegex: defaultValues?.groupsRegex ?? "",
			backgroundColor: defaultValues?.backgroundColor ?? "",
			borderColor: defaultValues?.borderColor ?? "",
			textColor: defaultValues?.textColor ?? "",
			date: defaultValues?.date ?? "",
			time: defaultValues?.time ?? "",
			buttonUrl: defaultValues?.buttonUrl ?? "",
			buttonText: defaultValues?.buttonText ?? "",
			allGroups: !defaultValues?.groupsRegex,
		},
	})

	const allGroups = watch("allGroups")
	const liveValues = useWatch({ control })
	const lastPreviewPayloadRef = useRef<string>("")

	useEffect(() => {
		if (!onValuesChange || !liveValues) return
		const { allGroups: _, ...rest } = liveValues
		const payload: EventFormValues = {
			title: rest.title ?? "",
			description: rest.description ?? "",
			groupsRegex: liveValues.allGroups ? undefined : (rest.groupsRegex ?? ""),
			backgroundColor: rest.backgroundColor ?? "",
			borderColor: rest.borderColor ?? "",
			textColor: rest.textColor ?? "",
			date: rest.date ?? "",
			time: rest.time ?? "",
			buttonUrl: rest.buttonUrl ?? "",
			buttonText: rest.buttonText ?? "",
			coverImage: coverUrl ?? undefined,
		}
		const serialized = JSON.stringify(payload)
		if (serialized === lastPreviewPayloadRef.current) return
		lastPreviewPayloadRef.current = serialized
		onValuesChange(payload)
	}, [liveValues, coverUrl, onValuesChange])

	const onFormSubmit = handleSubmit(async (data) => {
		const { allGroups: _, ...rest } = data
		await onSubmit({
			...rest,
			coverImage: coverUrl ?? undefined,
			groupsRegex: allGroups ? undefined : rest.groupsRegex,
		})
	})

	const isLoading = isSubmitting || isUploading

	const formError =
		uploadError ||
		errors.title?.message ||
		errors.backgroundColor?.message ||
		errors.borderColor?.message ||
		errors.textColor?.message ||
		errors.date?.message ||
		errors.time?.message ||
		null

	return (
		<div className="flex flex-col gap-4">
			<Controller
				control={control}
				name="title"
				render={({ field }) => (
					<FormField label="Название" required card>
						<input
							type="text"
							placeholder="Название события"
							maxLength={255}
							className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted"
							{...field}
						/>
					</FormField>
				)}
			/>

			<Controller
				control={control}
				name="description"
				render={({ field }) => (
					<FormField label="Описание" card>
						<textarea
							placeholder="Описание события..."
							rows={4}
							className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted resize-none"
							{...field}
						/>
					</FormField>
				)}
			/>

			<FormField label="Обложка">
				{coverUrl ? (
					<div className="relative rounded-3xl overflow-hidden">
						<LiquidBorder />
						<img
							src={coverUrl}
							alt="Обложка события"
							className="w-full aspect-2/1 object-cover"
						/>
						<div className="absolute top-2 right-2 flex gap-1">
							<Touchable>
								<button
									type="button"
									onClick={openFilePicker}
									className="bg-black/50 backdrop-blur-sm text-white rounded-full p-2"
								>
									<Icon
										name="iconify:material-symbols:edit-outline"
										size={18}
									/>
								</button>
							</Touchable>
							<Touchable>
								<button
									type="button"
									onClick={removeCover}
									className="bg-black/50 backdrop-blur-sm text-white rounded-full p-2"
								>
									<Icon
										name="iconify:material-symbols:close-rounded"
										size={18}
									/>
								</button>
							</Touchable>
						</div>
					</div>
				) : (
					<Touchable>
						<button
							type="button"
							onClick={openFilePicker}
							disabled={isUploading}
							className="border-2 border-dashed border-border rounded-3xl p-6 flex flex-col items-center gap-2 text-muted w-full"
						>
							{isUploading ? (
								<>
									<Icon
										name="iconify:material-symbols:progress-activity"
										size={32}
										className="animate-spin"
									/>
									<span className="text-sm">Загрузка...</span>
								</>
							) : (
								<>
									<Icon
										name="iconify:material-symbols:add-photo-alternate-outline"
										size={32}
									/>
									<span className="text-sm">
										Нажмите, чтобы загрузить обложку
									</span>
									<span className="text-xs">JPEG, PNG, GIF, WebP до 10 МБ</span>
								</>
							)}
						</button>
					</Touchable>
				)}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
					onChange={(e) => selectFile(e.target.files)}
					className="hidden"
				/>
			</FormField>

			<div className="flex gap-3">
				<Controller
					control={control}
					name="date"
					render={({ field }) => (
						<FormField label="Дата" required card className="flex-1">
							<input
								type="date"
								className="bg-card rounded-3xl p-3 w-full min-w-0 outline-none appearance-none"
								{...field}
							/>
						</FormField>
					)}
				/>
				<Controller
					control={control}
					name="time"
					render={({ field }) => (
						<FormField label="Время" required card className="flex-1">
							<input
								type="time"
								className="bg-card rounded-3xl p-3 w-full min-w-0 outline-none appearance-none"
								{...field}
							/>
						</FormField>
					)}
				/>
			</div>

			<Controller
				control={control}
				name="allGroups"
				render={({ field }) => (
					<div className="relative bg-card rounded-3xl p-4 flex items-center justify-between">
						<LiquidBorder />
						<span className="text-sm">Для всех групп</span>
						<Toggle value={field.value} onChange={field.onChange} />
					</div>
				)}
			/>

			{!allGroups && (
				<Controller
					control={control}
					name="groupsRegex"
					render={({ field }) => (
						<FormField label="Regex для групп" card>
							<input
								type="text"
								placeholder="^ИСП-.*"
								className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted text-sm"
								{...field}
							/>
						</FormField>
					)}
				/>
			)}

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<Controller
					control={control}
					name="backgroundColor"
					render={({ field }) => (
						<FormField label="Цвет карточки" card>
							<div className="flex items-center gap-2 bg-card rounded-3xl p-2">
								<input
									type="color"
									value={field.value || "#000000"}
									onChange={(e) =>
										field.onChange(normalizeHexColor(e.target.value))
									}
									className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0"
								/>
								<input
									type="text"
									placeholder="#1F2937"
									className="bg-transparent rounded-3xl px-2 py-1 w-full outline-none placeholder:text-muted"
									value={field.value}
									onChange={(e) => field.onChange(e.target.value)}
									onBlur={(e) =>
										field.onChange(normalizeHexColor(e.target.value.trim()))
									}
								/>
							</div>
						</FormField>
					)}
				/>
				<Controller
					control={control}
					name="borderColor"
					render={({ field }) => (
						<FormField label="Цвет обводки" card>
							<div className="flex items-center gap-2 bg-card rounded-3xl p-2">
								<input
									type="color"
									value={field.value || "#000000"}
									onChange={(e) =>
										field.onChange(normalizeHexColor(e.target.value))
									}
									className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0"
								/>
								<input
									type="text"
									placeholder="#3B82F6"
									className="bg-transparent rounded-3xl px-2 py-1 w-full outline-none placeholder:text-muted"
									value={field.value}
									onChange={(e) => field.onChange(e.target.value)}
									onBlur={(e) =>
										field.onChange(normalizeHexColor(e.target.value.trim()))
									}
								/>
							</div>
						</FormField>
					)}
				/>
				<Controller
					control={control}
					name="textColor"
					render={({ field }) => (
						<FormField label="Цвет текста" card>
							<div className="flex items-center gap-2 bg-card rounded-3xl p-2">
								<input
									type="color"
									value={field.value || "#000000"}
									onChange={(e) =>
										field.onChange(normalizeHexColor(e.target.value))
									}
									className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0"
								/>
								<input
									type="text"
									placeholder="#F9FAFB"
									className="bg-transparent rounded-3xl px-2 py-1 w-full outline-none placeholder:text-muted"
									value={field.value}
									onChange={(e) => field.onChange(e.target.value)}
									onBlur={(e) =>
										field.onChange(normalizeHexColor(e.target.value.trim()))
									}
								/>
							</div>
						</FormField>
					)}
				/>
			</div>

			<Controller
				control={control}
				name="buttonUrl"
				render={({ field }) => (
					<FormField label="URL кнопки" card>
						<input
							type="url"
							placeholder="https://example.com"
							className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted"
							{...field}
						/>
					</FormField>
				)}
			/>

			<Controller
				control={control}
				name="buttonText"
				render={({ field }) => (
					<FormField label="Текст кнопки" card>
						<input
							type="text"
							placeholder="Подробнее"
							maxLength={255}
							className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted"
							{...field}
						/>
					</FormField>
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
