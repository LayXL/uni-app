import type { Meta, StoryObj } from "@storybook/react-vite"

import { HomeworkIntro } from "./homework-intro"

const meta = {
	title: "Домашние задания/Добавление",
	component: HomeworkIntro,
	decorators: [
		(Story) => (
			<main className="mx-auto max-w-sm bg-background p-4 text-foreground">
				<Story />
			</main>
		),
	],
} satisfies Meta<typeof HomeworkIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
