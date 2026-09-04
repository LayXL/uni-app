import type { Meta, StoryObj } from "@storybook/react-vite"
import { useRef } from "react"

import { useFitScheduleTitle } from "../hooks/use-fit-schedule-title"
import { ScheduleTitle } from "./schedule-title"

const FitPreview = ({ text }: { text: string }) => {
	const ref = useRef<HTMLSpanElement>(null)
	useFitScheduleTitle(ref, text)
	return (
		<h2 className="min-w-0 flex-1 text-2xl font-semibold">
			<span
				ref={ref}
				className="schedule-title-text"
				data-default-title={text === "Расписание" || undefined}
				title={text}
			>
				{text}
			</span>
		</h2>
	)
}

const meta = {
	title: "Расписание/Сплеш-заголовок",
	component: ScheduleTitle,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ScheduleTitle>

export default meta
type Story = StoryObj<typeof meta>

export const FontFitting: Story = {
	render: () => (
		<div className="flex flex-col gap-6 p-4">
			{[
				"Расписание",
				"квест: не проспать",
				"4-й курс и не знаешь расписание?",
			].map((text) => (
				<div key={text} className="flex flex-wrap gap-4">
					{[320, 390].map((width) => (
						<div key={width} style={{ width }}>
							<p className="text-xs text-muted">Экран {width}px</p>
							<div className="flex h-16 items-center gap-3 pl-4 pr-2">
								<FitPreview text={text} />
								<div className="flex shrink-0 items-center gap-2">
									<span className="min-w-26 rounded-3xl bg-card px-3 py-2">
										Тест-401
									</span>
									<span className="size-10 rounded-full bg-card" />
								</div>
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	),
}
