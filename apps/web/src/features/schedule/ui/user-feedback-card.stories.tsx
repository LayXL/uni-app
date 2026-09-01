import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { type ComponentProps, useState } from "react"

import { ScheduleChannelBannerCard } from "./schedule-channel-banner"
import { UserFeedbackCard } from "./user-feedback-card"

const DismissibleFeedbackCard = (
	props: ComponentProps<typeof UserFeedbackCard>,
) => {
	const [isVisible, setIsVisible] = useState(true)

	if (!isVisible) return null

	return (
		<UserFeedbackCard
			{...props}
			onClose={() => {
				props.onClose()
				setIsVisible(false)
			}}
		/>
	)
}

const PreviewDay = ({ title, subject }: { title: string; subject: string }) => (
	<section className="flex flex-col gap-2 px-2">
		<h2 className="px-2 text-lg font-semibold">{title}</h2>
		<div className="flex items-center gap-2 rounded-3xl bg-card p-2 ring-1 ring-border/70">
			<p className="font-medium tabular-nums">1</p>
			<div className="h-10 w-px bg-border" />
			<div className="w-11 text-sm tabular-nums">
				<p>09:00</p>
				<p className="text-muted">+1:30</p>
			</div>
			<div className="h-10 w-px bg-border" />
			<div>
				<p className="font-medium">{subject}</p>
				<p className="text-sm text-muted">312 ауд</p>
			</div>
		</div>
	</section>
)

const meta = {
	title: "Расписание/Фидбек",
	component: UserFeedbackCard,
	parameters: {
		viewport: { defaultViewport: "mobile" },
	},
	tags: ["autodocs"],
	render: (args) => <DismissibleFeedbackCard {...args} />,
	args: {
		onSubmit: async () => {},
		onClose: () => {},
	},
	decorators: [
		(Story) => (
			<main className="mx-auto min-h-screen w-full max-w-md bg-background px-2 py-6 text-foreground">
				<Story />
			</main>
		),
	],
} satisfies Meta<typeof UserFeedbackCard>

export default meta
type Story = StoryObj<typeof meta>

export const Rating: Story = {
	name: "Выбор оценки",
}

export const LowRating: Story = {
	name: "Низкая оценка, причины и комментарий",
	args: {
		initialRating: 3,
		initialReasons: ["slow_loading", "incorrect_schedule"],
		initialComment: "Иногда расписание обновляется только после перезапуска.",
	},
}

export const PositiveRating: Story = {
	name: "Высокая оценка и комментарий",
	args: {
		initialRating: 5,
		initialComment: "Всё нравится, особенно карта корпусов.",
	},
}

export const BetweenScheduleDays: Story = {
	name: "Между днями расписания",
	render: (args) => (
		<div className="flex flex-col gap-6">
			<PreviewDay title="1 сентября, вторник" subject="Разработка приложений" />
			<DismissibleFeedbackCard {...args} initialRating={2} />
			<PreviewDay title="2 сентября, среда" subject="Базы данных" />
			<ScheduleChannelBannerCard />
			<PreviewDay
				title="3 сентября, четверг"
				subject="Проектирование интерфейсов"
			/>
		</div>
	),
}
