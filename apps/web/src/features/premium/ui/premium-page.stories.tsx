import type { Meta, StoryObj } from "@storybook/react-vite"

import { PremiumPage } from "./premium-page"

const meta = {
	title: "Страницы/МЭПП+",
	component: PremiumPage,
	args: { onDismiss: () => {} },
} satisfies Meta<typeof PremiumPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { name: "Первоапрельская подписка" }
