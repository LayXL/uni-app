import { Tabs } from "@base-ui/react/tabs"
import { useQuery } from "@tanstack/react-query"
import { useReducedMotion } from "motion/react"
import { useLayoutEffect, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"
import type { Timetable } from "@repo/shared/timetable"

import { useIsClient } from "@/shared/hooks/use-is-client"
import { BackButton } from "@/shared/ui/back-button"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { LottiePlayer } from "@/shared/ui/lottie"
import { haptic } from "@/shared/utils/haptic"
import { isVK } from "@/shared/utils/is-vk"

import "./timetable-tabs.css"

const timetablePeriods = [
	{ value: "weekdays", label: "Будние", days: [1, 2, 3, 4, 5] },
	{ value: "saturday", label: "Суббота", days: [6] },
] as const

const TimeRange = ({ start, end }: { start: string; end: string }) => (
	<span className="shrink-0 whitespace-nowrap tabular-nums">
		<time dateTime={start.padStart(5, "0")}>{start.padStart(5, "0")}</time>
		{"–"}
		<time dateTime={end.padStart(5, "0")}>{end.padStart(5, "0")}</time>
	</span>
)

const TimetableSchedule = ({ timetable }: { timetable: Timetable }) => (
	<div className="flex flex-col gap-6">
		{timetable.map(({ days, schedule }) => (
			<div
				key={days.join("-")}
				className="relative overflow-hidden rounded-3xl bg-card"
			>
				<LiquidBorder />
				<ol className="divide-y divide-border/50">
					{schedule.map((item) => (
						<li
							key={`${item.type ?? "lesson"}-${item.number}`}
							className="flex items-center justify-between gap-2 px-3 py-3"
						>
							<h2 className="shrink-0 text-sm font-semibold">
								{item.type === "lunch" ? "Обед" : `${item.number} пара`}
							</h2>
							{item.attachments && item.attachments.length > 0 ? (
								<dl className="flex flex-wrap justify-end gap-1.5 text-xs min-[360px]:text-sm">
									{item.attachments.map((half) => (
										<div
											key={half.number}
											className="rounded-xl bg-background px-2 py-1.5"
										>
											<dt className="sr-only">{half.number}-я половина</dt>
											<dd>
												<TimeRange {...half.time} />
											</dd>
										</div>
									))}
								</dl>
							) : (
								<div className="rounded-xl bg-background px-2 py-1.5 text-xs min-[360px]:text-sm">
									<TimeRange {...item.time} />
								</div>
							)}
						</li>
					))}
				</ol>
			</div>
		))}
	</div>
)

const moveIndicator = (
	tab: HTMLElement | null | undefined,
	pill: HTMLSpanElement | null,
	animate: boolean,
) => {
	if (!tab || !pill) return

	const previousTransition = pill.style.transition
	if (!animate) pill.style.transition = "none"
	pill.style.transform = `translateX(${tab.offsetLeft}px)`
	pill.style.width = `${tab.offsetWidth}px`
	if (!animate) {
		void pill.offsetWidth
		pill.style.transition = previousTransition
	}
}

const TimetableTabs = ({ timetable }: { timetable: Timetable }) => {
	const [period, setPeriod] = useState("weekdays")
	const listRef = useRef<HTMLDivElement>(null)
	const pillRef = useRef<HTMLSpanElement>(null)

	useLayoutEffect(() => {
		const list = listRef.current
		if (!list) return
		const observer = new ResizeObserver(() =>
			moveIndicator(
				list.querySelector<HTMLElement>('[aria-selected="true"]'),
				pillRef.current,
				false,
			),
		)
		observer.observe(list)
		return () => observer.disconnect()
	}, [])

	useLayoutEffect(() => {
		moveIndicator(
			listRef.current?.querySelector<HTMLElement>(`[data-period="${period}"]`),
			pillRef.current,
			Boolean(pillRef.current?.style.width),
		)
	}, [period])

	return (
		<Tabs.Root
			value={period}
			onValueChange={(value) => {
				if (typeof value !== "string") return
				haptic("selection")
				setPeriod(value)
			}}
		>
			<Tabs.List
				ref={listRef}
				aria-label="Дни расписания звонков"
				className="t-tabs timetable-tabs mb-4"
				activateOnFocus
			>
				<LiquidBorder />
				<span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
				{timetablePeriods.map(({ value, label }) => (
					<Tabs.Tab
						key={value}
						value={value}
						data-period={value}
						className="t-tab"
					>
						{label}
					</Tabs.Tab>
				))}
			</Tabs.List>
			{timetablePeriods.map(({ value, days }) => {
				const schedule = timetable.filter((day) =>
					days.some((weekday) => day.days.includes(weekday)),
				)
				return (
					<Tabs.Panel key={value} value={value}>
						{schedule.length > 0 ? (
							<TimetableSchedule timetable={schedule} />
						) : (
							<p className="px-2 text-sm text-muted">
								Расписание на эти дни пока не добавлено.
							</p>
						)}
					</Tabs.Panel>
				)
			})}
		</Tabs.Root>
	)
}

export const TimetablePage = () => {
	const reducedMotion = useReducedMotion()
	const isClient = useIsClient()
	const timetable = useQuery({
		...orpc.schedule.getTimetable.queryOptions(),
		enabled: isClient,
	})

	return (
		<main className="min-h-dvh px-2 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]">
			<div className="px-2">
				{isVK() && <BackButton />}
				<header className="mb-6 flex flex-col items-center gap-2 text-center">
					<LottiePlayer
						src="bell"
						className="size-28"
						autoplay={!reducedMotion}
						disableFadeIn
					/>
					<div className="flex max-w-sm flex-col gap-1">
						<h1 className="text-xl font-bold">Расписание звонков</h1>
						<p className="text-sm text-muted text-balance">
							Начало и конец каждой пары и её половин
						</p>
					</div>
				</header>
			</div>
			{timetable.isPending ? (
				<p role="status" className="px-2 text-sm text-muted">
					Загрузка расписания звонков…
				</p>
			) : timetable.isError ? (
				<div role="alert" className="px-2 text-sm">
					<p>Не удалось загрузить расписание звонков.</p>
					<button
						type="button"
						onClick={() => void timetable.refetch()}
						className="mt-2 text-accent underline"
					>
						Повторить загрузку
					</button>
				</div>
			) : timetable.data.length === 0 ? (
				<p className="px-2 text-sm text-muted">
					Расписание звонков пока не добавлено.
				</p>
			) : (
				<TimetableTabs timetable={timetable.data} />
			)}
		</main>
	)
}
