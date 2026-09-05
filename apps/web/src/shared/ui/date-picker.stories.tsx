import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "./button"
import { DatePicker } from "./date-picker"
import { FormField } from "./form-field"

const meta = {
	title: "Формы/Выбор даты",
	component: DatePicker,
	globals: { theme: "light" },
	args: { value: "", ariaLabel: "Дедлайн", onChange: () => {} },
	render: function Example(args) {
		const [savedDate, setSavedDate] = useState("")
		const { control, handleSubmit } = useForm({
			defaultValues: { deadline: args.value },
		})

		return (
			<form
				className="mx-auto flex w-full max-w-sm flex-col gap-4 p-4 text-foreground"
				onSubmit={handleSubmit((data) => setSavedDate(data.deadline))}
			>
				<Controller
					control={control}
					name="deadline"
					rules={{ required: "Выбери дедлайн" }}
					render={({ field, fieldState }) => (
						<>
							<FormField label="Дедлайн" required card>
								<DatePicker {...args} {...field} invalid={!!fieldState.error} />
							</FormField>
							{fieldState.error && (
								<p role="alert" className="text-sm text-destructive">
									{fieldState.error.message}
								</p>
							)}
						</>
					)}
				/>
				<Button
					label="Сохранить"
					onClick={handleSubmit((data) => setSavedDate(data.deadline))}
				/>
				<output className="text-sm text-muted">{savedDate}</output>
			</form>
		)
	},
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const Selected: Story = {
	args: { value: "2026-12-31" },
}

export const Disabled: Story = {
	args: { value: "2026-09-15", disabled: true },
}

export const LimitedHeight: Story = {
	args: { value: "2026-03-01" },
	decorators: [
		(Story) => (
			<div className="flex min-h-dvh items-center">
				<Story />
			</div>
		),
	],
}
