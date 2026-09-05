import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"

import { ScheduleTimerDigits } from "./schedule-timer-digits"

const Countdown = ({ time }: { time: string }) => {
	const [remaining, setRemaining] = useState(() =>
		time.split(":").reduce((seconds, part) => seconds * 60 + Number(part), 0),
	)

	useEffect(() => {
		const interval = window.setInterval(() => {
			setRemaining((seconds) => Math.max(0, seconds - 1))
		}, 1000)
		return () => window.clearInterval(interval)
	}, [])

	const hours = Math.floor(remaining / 3600)
	const minutes = Math.floor((remaining % 3600) / 60)
	const seconds = String(remaining % 60).padStart(2, "0")
	const value = hours
		? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
		: `${minutes}:${seconds}`

	return <ScheduleTimerDigits time={value} />
}

const meta = {
	title: "Расписание/Цифры таймера",
	component: ScheduleTimerDigits,
	args: { time: "1:02" },
	render: ({ time }) => <Countdown key={time} time={time} />,
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-md px-2 py-6">
				<div className="flex flex-col items-center rounded-3xl bg-card p-3">
					<Story />
					<span className="text-sm font-medium text-muted">
						до начала 2-й пары
					</span>
				</div>
			</div>
		),
	],
} satisfies Meta<typeof ScheduleTimerDigits>

export default meta
type Story = StoryObj<typeof meta>

export const MinuteRollover: Story = { name: "Смена минуты" }
export const HourRollover: Story = {
	name: "Смена часа",
	args: { time: "1:00:02" },
}
export const LeadingDigit: Story = {
	name: "Исчезновение старшего разряда",
	args: { time: "10:02" },
}
export const Zero: Story = {
	name: "Обратный отсчёт до нуля",
	args: { time: "0:03" },
}
