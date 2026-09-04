import type { Meta, StoryObj } from "@storybook/react-vite"

import { TeacherScheduleProfile } from "./teacher-schedule-profile"

const meta = {
	title: "Расписание/Профиль преподавателя",
	component: TeacherScheduleProfile,
	parameters: { layout: "fullscreen" },
	argTypes: { avatarUrl: { control: "text" } },
	args: {
		displayName: "Абрамова Елена Николаевна (Доцент КГиМБК)",
		avatarUrl: null,
	},
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-[390px]">
				<Story />
				<h2 className="px-4 mb-4 text-xl font-bold">Расписание</h2>
				<div className="px-4 text-lg font-semibold">5 сентября, суббота</div>
			</div>
		),
	],
} satisfies Meta<typeof TeacherScheduleProfile>

export default meta
type Story = StoryObj<typeof meta>

export const WithoutPhoto: Story = {}
export const UnavailablePhoto: Story = {
	args: { avatarUrl: "/missing-teacher-avatar.webp" },
}
export const LongName: Story = {
	args: {
		displayName: "Константинопольская Александра Владиславовна (Преподаватель)",
	},
}
