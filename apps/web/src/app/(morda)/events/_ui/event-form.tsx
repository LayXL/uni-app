"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import z from "zod"

import { Button } from "@/shared/ui/button"
import { FormField } from "@/shared/ui/form-field"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Toggle } from "@/shared/ui/toggle"

const formSchema = z.object({
	title: z.string().min(1, "Введите название").max(255),
	description: z.string().optional(),
	coverImage: z.string().optional(),
	groupsRegex: z.string().optional(),
	date: z.string().min(1, "Выберите дату"),
	time: z.string().min(1, "Выберите время"),
	buttonUrl: z.string().optional(),
	buttonText: z.string().max(255).optional(),
	allGroups: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export type EventFormValues = Omit<FormValues, "allGroups">

type EventFormProps = {
	defaultValues?: Partial<EventFormValues>
	onSubmit: (data: EventFormValues) => Promise<void>
	submitLabel: string
	submittingLabel: string
	onCancel?: () => void
}

export function EventForm({
	defaultValues,
	onSubmit,
	submitLabel,
	submittingLabel,
	onCancel,
}: EventFormProps) {
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
			coverImage: defaultValues?.coverImage ?? "",
			groupsRegex: defaultValues?.groupsRegex ?? "",
			date: defaultValues?.date ?? "",
			time: defaultValues?.time ?? "",
			buttonUrl: defaultValues?.buttonUrl ?? "",
			buttonText: defaultValues?.buttonText ?? "",
			allGroups: !defaultValues?.groupsRegex,
		},
	})

	const allGroups = watch("allGroups")

	const onFormSubmit = handleSubmit(async (data) => {
		const { allGroups: _, ...rest } = data
		await onSubmit({
			...rest,
			groupsRegex: allGroups ? undefined : rest.groupsRegex,
		})
	})

	const formError =
		errors.title?.message ||
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

			<Controller
				control={control}
				name="coverImage"
				render={({ field }) => (
					<FormField label="Обложка (URL)" card>
						<input
							type="url"
							placeholder="https://example.com/image.jpg"
							className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted"
							{...field}
						/>
					</FormField>
				)}
			/>

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
								className="bg-card rounded-3xl p-3 w-full outline-none placeholder:text-muted font-mono text-sm"
								{...field}
							/>
						</FormField>
					)}
				/>
			)}

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
						disabled={isSubmitting}
						onClick={onFormSubmit}
						className="flex-1"
					/>
				</div>
			) : (
				<Button
					label={isSubmitting ? submittingLabel : submitLabel}
					disabled={isSubmitting}
					onClick={onFormSubmit}
				/>
			)}
		</div>
	)
}
