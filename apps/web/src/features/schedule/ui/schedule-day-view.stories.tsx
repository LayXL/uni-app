import type { Meta, StoryObj } from "@storybook/react-vite"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"
import { defaultCardSettings } from "@repo/shared/lessons/card-settings"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { cn } from "@/shared/utils/cn"

import { ScheduleCardList } from "./schedule-card-list"
import { ScheduleCardSettingsControl } from "./schedule-card-settings"
import { ScheduleDayView } from "./schedule-day-view"
import { WithoutLessonsPlaceholder } from "./without-lessons-placeholder"

const today = "2026-09-11"
const dates = getNextTwoWeeksDates({ now: new Date(`${today}T12:00:00Z`) })
const lesson: Lesson = {
	date: today,
	order: 3,
	startTime: "11:40",
	endTime: "13:15",
	classroom: "334",
	isCancelled: false,
	isChanged: false,
	isDistance: false,
	original: null,
	subject: {
		id: 1,
		name: "Проектирование пользовательских интерфейсов информационных систем",
	},
	groups: [{ id: 1, type: "teacher", displayName: "Иванов Иван Иванович" }],
}

const Preview = ({ lessonCount = 2 }: { lessonCount?: number }) => {
	const [selectedDate, setSelectedDate] = useState(today)
	const [settings, setSettings] = useState<typeof defaultCardSettings>({
		...defaultCardSettings,
		viewMode: "day",
	})
	const { viewMode } = settings
	const renderDay = (date: string) => (
		<section
			key={date}
			className={cn("px-2", viewMode === "day" && "flex flex-1 flex-col")}
		>
			{viewMode === "list" && (
				<h2 className="mb-2 px-2 font-semibold">{date}</h2>
			)}
			{date === "2026-09-12" ? (
				<WithoutLessonsPlaceholder
					date={date}
					fillHeight={viewMode === "day"}
				/>
			) : (
				<ScheduleCardList mergeCards>
					{Array.from({ length: lessonCount }, (_, index) => (
						<LessonCard
							key={index}
							lesson={{
								...lesson,
								date,
								order: index + 1,
							}}
							variant="row"
						/>
					))}
				</ScheduleCardList>
			)}
		</section>
	)
	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="flex justify-end px-2">
				<ScheduleCardSettingsControl
					settings={{
						...settings,
						isLoading: false,
						isSaving: false,
						error: null,
						retry: () => {},
						setSetting: (key, value) =>
							setSettings((current) => ({ ...current, [key]: value })),
					}}
				/>
			</div>
			{viewMode === "day" ? (
				<ScheduleDayView
					dates={dates}
					selectedDate={selectedDate}
					today={today}
					onSelect={setSelectedDate}
					renderDay={renderDay}
				/>
			) : (
				dates.map(renderDay)
			)}
		</div>
	)
}

const DayPreview = ({ lessonCount = 2 }: { lessonCount?: number }) => {
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: { queries: { staleTime: Infinity } },
		})
		client.setQueryData(orpc.groups.getAllGroups.queryKey({}), [])
		return client
	})
	const [router] = useState(() =>
		createRouter({
			routeTree: createRootRoute({
				component: () => <Preview lessonCount={lessonCount} />,
			}),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		}),
	)
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
}

const meta = {
	title: "Расписание/По дням",
	component: DayPreview,
	decorators: [
		(Story) => (
			<main className="mx-auto flex min-h-dvh flex-col w-full max-w-[390px] bg-background py-4 text-foreground">
				<Story />
			</main>
		),
	],
} satisfies Meta<typeof DayPreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}

export const LongDay: Story = {
	name: "Длинный день — вертикальная прокрутка",
	args: { lessonCount: 10 },
}
