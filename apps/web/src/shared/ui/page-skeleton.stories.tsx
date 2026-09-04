import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"

import { LiquidBorder } from "./liquid-border"
import { PageSkeleton } from "./page-skeleton"

const lesson = {
	date: "2026-09-04",
	order: 1,
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject: { id: 39, name: "Специальный рисунок" },
	groups: [
		{ id: 399, displayName: "Дв-398", type: "studentsGroup" },
		{
			id: 459,
			displayName: "Максимова Полина Артемовна (Преподаватель)",
			type: "teacher",
		},
	],
	startTime: "08:00",
	endTime: "09:35",
} satisfies Lesson

const days = [
	{
		date: "4 сентября, пятница",
		relativeDate: "сегодня",
		lessons: [
			lesson,
			{
				...lesson,
				order: 2,
				startTime: "09:45",
				endTime: "11:20",
				subject: {
					id: 40,
					name: "Проектирование пользовательских интерфейсов",
				},
			},
		],
	},
	{
		date: "5 сентября, суббота",
		relativeDate: "завтра",
		lessons: [{ ...lesson, date: "2026-09-05" }],
	},
]

// Static data with the layout from ScheduleHeader, ScheduleTimer and
// ScheduleViewer, and the production LessonCard component.
const LoadedSchedulePreview = ({ showTimer }: { showTimer: boolean }) => (
	<>
		<div className="pl-4 pr-2 h-16 flex items-center justify-between">
			<h2 className="text-2xl font-semibold">Расписание</h2>
			<div className="relative min-w-26 bg-card rounded-3xl px-3 py-2">
				<LiquidBorder />
				Дв-398
			</div>
		</div>
		{showTimer && (
			<div className="px-2 mb-4">
				<div className="relative bg-card p-3 rounded-3xl overflow-hidden">
					<LiquidBorder />
					<div className="text-center text-lg flex flex-col items-center justify-center">
						<span className="text-2xl font-semibold tabular-nums">24:18</span>
						<span className="text-sm text-muted font-medium">
							до конца 1-й пары
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-1 px-4 mt-2">
					<div className="text-xs flex justify-between gap-2">
						<span className="text-muted truncate">Начало 2-й пары</span>
						<span className="whitespace-nowrap">34 мин</span>
					</div>
					<div className="text-xs flex justify-between gap-2">
						<span className="text-muted truncate">Конец 2-й пары</span>
						<span className="whitespace-nowrap">2 ч 9 мин</span>
					</div>
				</div>
			</div>
		)}
		<div className="pb-2 flex flex-col gap-6">
			{days.map((day, dayIndex) => (
				<section key={day.date} className="px-2 flex flex-col gap-2">
					<h2 className="flex items-baseline justify-between gap-2 px-2 text-lg font-semibold">
						<span>{day.date}</span>
						<span className="shrink-0 text-sm font-normal text-muted">
							{day.relativeDate}
						</span>
					</h2>
					<div className="flex flex-col gap-2">
						{day.lessons.map((item) => (
							<LessonCard
								key={item.order}
								group={399}
								lesson={item}
								isActive={showTimer && dayIndex === 0 && item.order === 1}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	</>
)

const stages = [
	"Первичная загрузка",
	"Скелетон расписания",
	"Готовая страница",
] as const

type PreviewProps = {
	delayMs: number
	scheduleDelayMs: number
	showTimer: boolean
}

const LoadingTransition = ({
	delayMs,
	scheduleDelayMs,
	showTimer,
	onReplay,
}: PreviewProps & { onReplay: () => void }) => {
	const [stage, setStage] = useState(0)
	const [isPlaying, setIsPlaying] = useState(true)

	useEffect(() => {
		if (!isPlaying || stage === 2) return
		const timeout = window.setTimeout(
			() => setStage((value) => value + 1),
			stage === 0 ? delayMs : scheduleDelayMs,
		)
		return () => window.clearTimeout(timeout)
	}, [delayMs, scheduleDelayMs, stage, isPlaying])

	return (
		<div className="mx-auto max-w-md">
			<div className="flex flex-col gap-3 border-b border-border p-4">
				<p className="text-sm text-muted" aria-live="polite">
					{stage + 1} / 3 — {stages[stage]}
				</p>
				<div
					className="grid grid-cols-3 gap-2"
					role="group"
					aria-label="Состояние страницы"
				>
					{stages.map((label, index) => (
						<button
							key={label}
							type="button"
							aria-pressed={stage === index}
							className="rounded-xl border border-border px-2 py-2 text-center text-xs aria-pressed:border-accent aria-pressed:text-accent"
							onClick={() => {
								setIsPlaying(false)
								setStage(index)
							}}
						>
							{label}
						</button>
					))}
				</div>
				<button
					type="button"
					className="rounded-2xl bg-accent px-4 py-3 text-center text-sm font-medium text-accent-foreground"
					onClick={onReplay}
				>
					Повторить переход
				</button>
			</div>
			<div className="flex min-h-screen flex-col pt-(--safe-area-inset-top) pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
				{stage === 2 ? (
					<LoadedSchedulePreview showTimer={showTimer} />
				) : stage === 1 ? (
					<PageSkeleton
						key="schedule"
						title="Расписание"
						label="Загрузка расписания"
					/>
				) : (
					<PageSkeleton key="initial" />
				)}
			</div>
		</div>
	)
}

const LoadingTransitionPreview = ({
	delayMs,
	scheduleDelayMs,
	showTimer,
}: PreviewProps) => {
	const [replay, setReplay] = useState(0)

	return (
		<LoadingTransition
			key={`${replay}-${delayMs}-${scheduleDelayMs}`}
			delayMs={delayMs}
			scheduleDelayMs={scheduleDelayMs}
			showTimer={showTimer}
			onReplay={() => setReplay((value) => value + 1)}
		/>
	)
}

const meta = {
	title: "Расписание/Состояния загрузки",
	component: LoadingTransitionPreview,
	tags: ["autodocs"],
	args: {
		delayMs: 1800,
		scheduleDelayMs: 1800,
		showTimer: true,
	},
	argTypes: {
		scheduleDelayMs: {
			name: "Длительность загрузки расписания, мс",
			control: { type: "range", min: 500, max: 5000, step: 100 },
		},
		showTimer: {
			name: "Показать таймер занятия",
			control: "boolean",
		},
		delayMs: {
			name: "Длительность первичной загрузки, мс",
			control: { type: "range", min: 500, max: 5000, step: 100 },
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					"Три состояния: первичная загрузка → скелетон расписания → заполненная страница. Кнопки состояний останавливают автоматическое воспроизведение для сравнения; «Повторить переход» запускает его заново. В Controls можно настроить обе задержки и скрыть таймер. Финальное состояние показывает область расписания с демонстрационными данными и настоящими LessonCard; разметка шапки, таймера и дней повторяет страницу приложения. Нижняя навигация и дополнительные баннеры не включены.",
			},
		},
	},
} satisfies Meta<typeof LoadingTransitionPreview>

export default meta
type Story = StoryObj<typeof meta>

export const InitialToSchedule: Story = {
	name: "Первичная загрузка → скелетон → страница",
}
