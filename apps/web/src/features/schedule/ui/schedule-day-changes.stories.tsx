import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { ScheduleDayChanges } from "./schedule-day-changes"

const createLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
	date: "2026-09-01",
	order: 1,
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: true,
	original: null,
	subject: { id: 39, name: "Специальный рисунок" },
	groups: [],
	startTime: "08:00",
	endTime: "09:35",
	...overrides,
})

const meta = {
	title: "Расписание/Изменения за день",
	component: ScheduleDayChanges,
	parameters: {
		viewport: { defaultViewport: "mobile" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-2 bg-background px-4 py-6 text-foreground">
				<h2 className="px-2 text-lg font-semibold">1 сентября, вторник</h2>
				<Story />
			</main>
		),
	],
} satisfies Meta<typeof ScheduleDayChanges>

export default meta
type Story = StoryObj<typeof meta>

export const ClassroomChanged: Story = {
	name: "Поменялся кабинет",
	args: {
		lessons: [
			createLesson({
				classroom: "206",
				original: { classroom: "334" },
			}),
		],
	},
}

export const SubjectChanged: Story = {
	name: "Поменялся предмет",
	args: {
		lessons: [
			createLesson({
				original: { subject: "Основы композиции" },
			}),
		],
	},
}

export const SubjectAndClassroomChanged: Story = {
	name: "Поменялись предмет и кабинет",
	args: {
		lessons: [
			createLesson({
				classroom: "206",
				original: {
					subject: "Основы композиции",
					classroom: "334",
				},
			}),
		],
	},
}

export const SeveralLessonsChanged: Story = {
	name: "Замены у нескольких пар",
	args: {
		lessons: [
			createLesson({
				classroom: "206",
				original: { classroom: "334" },
			}),
			createLesson({
				order: 3,
				subject: { id: 40, name: "Живопись" },
				original: { subject: "Черчение" },
			}),
		],
	},
}

export const Distance: Story = {
	name: "Пара стала дистанционной",
	args: {
		lessons: [
			createLesson({
				isDistance: true,
				classroom: "дистант",
				original: { classroom: "334", isDistance: false },
			}),
		],
	},
}

export const Cancelled: Story = {
	name: "Пару отменили",
	args: {
		lessons: [
			createLesson({
				isCancelled: true,
				classroom: "отменено",
				original: { classroom: "334", isCancelled: false },
			}),
		],
	},
}
