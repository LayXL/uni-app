import type { Meta, StoryObj } from "@storybook/react-vite"

import { MaintenancePage } from "./maintenance-page"

const meta = {
	title: "Страницы/Технические неполадки",
	component: MaintenancePage,
	parameters: {
		viewport: { defaultViewport: "mobile" },
	},
	tags: ["autodocs"],
	args: {
		title: "Технические шоколадки",
		description:
			"Мы уже разбираемся с неполадками. Попробуйте вернуться немного позже.",
	},
} satisfies Meta<typeof MaintenancePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	name: "Экран технических неполадок",
}
