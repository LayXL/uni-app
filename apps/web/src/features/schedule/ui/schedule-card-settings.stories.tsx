import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { defaultCardSettings } from "@repo/shared/lessons/card-settings"

import { ScheduleCardSettingsControl } from "./schedule-card-settings"

const Preview = ({ showHint = false }: { showHint?: boolean }) => {
	const [hintVisible, setHintVisible] = useState(showHint)
	const [settings, setSettings] = useState(defaultCardSettings)
	return (
		<ScheduleCardSettingsControl
			hint={{
				visible: hintVisible,
				isSaving: false,
				error: false,
				dismiss: () => setHintVisible(false),
			}}
			settings={{
				...settings,
				isLoading: false,
				isSaving: false,
				error: null,
				retry: () => {},
				setSetting: (key, value) =>
					setSettings((current) => ({ ...current, [key]: value })),
			}}
		/>
	)
}

const meta = {
	title: "Расписание/Настройки карточек",
	component: Preview,
	decorators: [
		(Story) => (
			<main className="mx-auto min-h-screen max-w-md bg-background p-4 text-foreground">
				<div className="flex justify-end">
					<Story />
				</div>
			</main>
		),
	],
} satisfies Meta<typeof Preview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Hint: Story = {
	name: "Подсказка во второй сессии",
	args: { showHint: true },
}
