import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import {
	AnimatedScheduleChannelBanner,
	ScheduleChannelBannerCard,
} from "./schedule-channel-banner"

const PreviewLesson = ({
	order,
	time,
	subject,
	classroom,
}: {
	order: number
	time: string
	subject: string
	classroom: string
}) => (
	<div className="relative flex items-center gap-2 rounded-3xl bg-card px-2 py-2 ring-1 ring-border/70">
		<p className="font-medium tabular-nums">{order}</p>
		<div className="h-10 w-px bg-border" />
		<div className="w-11 text-sm tabular-nums">
			<p>{time}</p>
			<p className="text-muted">+1:30</p>
		</div>
		<div className="h-10 w-px bg-border" />
		<div>
			<p className="font-medium">{subject}</p>
			<p className="text-sm text-muted">{classroom} ауд</p>
		</div>
	</div>
)

const SchedulePagePreview = () => {
	const [isHidden, setIsHidden] = useState(false)

	return (
		<main className="min-h-screen bg-background px-2 py-6 text-foreground">
			<div className="mx-auto flex w-full max-w-md flex-col gap-6">
				<section className="flex flex-col gap-2">
					<h2 className="px-2 text-lg font-semibold">
						31 августа, понедельник
					</h2>
					<PreviewLesson
						order={1}
						time="09:00"
						subject="Разработка приложений"
						classroom="312"
					/>
					<PreviewLesson
						order={2}
						time="10:40"
						subject="Проектирование интерфейсов"
						classroom="410"
					/>
				</section>

				<AnimatedScheduleChannelBanner
					isVisible={!isHidden}
					onDismiss={() => setIsHidden(true)}
				/>

				<section className="flex flex-col gap-2">
					<h2 className="px-2 text-lg font-semibold">1 сентября, вторник</h2>
					<PreviewLesson
						order={1}
						time="09:00"
						subject="Базы данных"
						classroom="205"
					/>
				</section>

				{isHidden && (
					<button
						type="button"
						onClick={() => setIsHidden(false)}
						className="mx-2 rounded-2xl border border-dashed border-border p-3 text-center text-sm text-muted"
					>
						Показать баннер снова
					</button>
				)}
			</div>
		</main>
	)
}

const meta = {
	title: "Расписание/Рекламный баннер",
	component: ScheduleChannelBannerCard,
	parameters: {
		viewport: { defaultViewport: "mobile" },
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ScheduleChannelBannerCard>

export default meta
type Story = StoryObj<typeof meta>

export const BetweenDays: Story = {
	name: "Между днями расписания",
	render: () => <SchedulePagePreview />,
}

export const BannerOnly: Story = {
	name: "Только баннер",
	args: {
		onDismiss: () => {},
	},
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-md px-2 py-6">
				<Story />
			</div>
		),
	],
}
