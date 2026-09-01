import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LessonCard } from "./lesson-card"

// Snapshot from the production schedule API, fetched once on 2026-09-01.
const lesson = {
	date: "2026-09-01",
	order: 1,
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject: {
		id: 39,
		name: "Специальный рисунок",
	},
	groups: [
		{
			id: 399,
			displayName: "Дв-398",
			type: "studentsGroup",
		},
		{
			id: 459,
			displayName: "Максимова Полина Артемовна (Преподаватель)",
			type: "teacher",
		},
	],
	startTime: "08:00",
	endTime: "09:35",
} satisfies Lesson

const meta = {
	title: "Расписание/Карточка занятия",
	component: LessonCard,
	parameters: {
		viewport: { defaultViewport: "mobile" },
	},
	tags: ["autodocs"],
	args: {
		group: 399,
		lesson,
		isActive: false,
		isTeacherView: false,
	},
	decorators: [
		(Story) => (
			<main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-2 py-6 text-foreground">
				<Story />
			</main>
		),
	],
} satisfies Meta<typeof LessonCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	name: "По данным бэкенда",
}

export const Active: Story = {
	name: "Текущее занятие",
	args: {
		isActive: true,
	},
}

export const TeacherView: Story = {
	name: "Расписание преподавателя",
	args: {
		group: 459,
		isTeacherView: true,
	},
}
