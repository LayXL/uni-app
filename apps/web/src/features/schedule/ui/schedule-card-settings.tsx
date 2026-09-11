"use client"

import { useRef, useState } from "react"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LessonCard } from "@/entities/lesson/ui/lesson-card"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { Toggle } from "@/shared/ui/toggle"
import { Touchable } from "@/shared/ui/touchable"

import { useScheduleSettingsHint } from "../hooks/use-schedule-settings-hint"
import { type CardSettings, useCardSettings } from "../model/card-settings"
import { ScheduleCardList } from "./schedule-card-list"
import {
	ScheduleSettingsHint,
	type ScheduleSettingsHintState,
} from "./schedule-settings-hint"
import { ScheduleViewMode } from "./schedule-view-mode"

const previewLesson: Lesson = {
	date: "2026-09-01",
	order: 3,
	startTime: "11:40",
	endTime: "13:15",
	classroom: "334",
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject: { id: 1, name: "Математика" },
	groups: [
		{ id: 1, displayName: "Ис-241", type: "studentsGroup" },
		{ id: 2, displayName: "Ис-242", type: "studentsGroup" },
		{ id: 3, displayName: "Иванов Иван Иванович", type: "teacher" },
	],
}

const previewLessons: Lesson[] = [
	previewLesson,
	{
		...previewLesson,
		order: 4,
		startTime: "13:45",
		endTime: "15:20",
		subject: { id: 2, name: "Информатика" },
	},
]

const options: {
	key: Exclude<keyof CardSettings, "viewMode">
	label: string
}[] = [
	{ key: "showFullTeacherName", label: "Полное ФИО преподавателя" },
	{ key: "showParallelGroups", label: "Показывать параллельные группы" },
	{ key: "mergeCards", label: "Склеивать карточки расписания" },
]

export const ScheduleCardSettings = () => {
	const settings = useCardSettings()
	const hint = useScheduleSettingsHint()
	return <ScheduleCardSettingsControl settings={settings} hint={hint} />
}

export const ScheduleCardSettingsControl = ({
	settings,
	hint,
}: {
	settings: ReturnType<typeof useCardSettings>
	hint?: ScheduleSettingsHintState
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [hintHidden, setHintHidden] = useState(false)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const hintOpen = Boolean(hint?.visible && !hintHidden && !isOpen)

	return (
		<>
			<Touchable>
				<button
					ref={buttonRef}
					type="button"
					aria-label="Настройки карточек расписания"
					aria-haspopup="dialog"
					aria-expanded={isOpen}
					className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-card"
					onClick={() => {
						setHintHidden(true)
						setIsOpen(true)
						if (hint?.visible && !hint.isSaving) hint.dismiss()
					}}
				>
					<LiquidBorder />
					{hintOpen && (
						<span
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 overflow-hidden rounded-full bg-accent/20"
						>
							<span className="absolute -inset-[150%] animate-channel-border bg-[conic-gradient(from_90deg,transparent_0deg,transparent_180deg,var(--accent)_300deg,transparent_360deg)] motion-reduce:animate-none" />
							<span className="absolute inset-[1.5px] rounded-full bg-card" />
						</span>
					)}
					<Icon name="gear-outline-20" className="relative" />
				</button>
			</Touchable>
			{hint && (
				<ScheduleSettingsHint
					anchor={buttonRef}
					hint={hint}
					open={hintOpen}
					onClose={() => setHintHidden(true)}
				/>
			)}
			<ModalRoot
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				className="max-h-[80dvh] overflow-y-auto"
			>
				<section
					role="dialog"
					aria-modal="true"
					aria-labelledby="card-settings-title"
				>
					<h2 id="card-settings-title" className="pr-10 text-xl font-semibold">
						Настроить
					</h2>
					<div className="py-3">
						<p className="mb-2">Вид расписания</p>
						<ScheduleViewMode
							value={settings.viewMode}
							disabled={settings.isLoading || settings.isSaving}
							onChange={(mode) => settings.setSetting("viewMode", mode)}
						/>
					</div>
					<div className="my-5">
						<p className="mb-2 text-sm text-muted">Превью</p>
						<div inert>
							<ScheduleCardList mergeCards={settings.mergeCards}>
								{previewLessons.map((lesson) => (
									<LessonCard
										key={lesson.order}
										lesson={lesson}
										group={1}
										variant={settings.mergeCards ? "row" : "card"}
										showFullTeacherName={settings.showFullTeacherName}
										showParallelGroups={settings.showParallelGroups}
									/>
								))}
							</ScheduleCardList>
						</div>
					</div>
					<div>
						{options.map(({ key, label }) => (
							<div
								key={key}
								className="flex items-center justify-between gap-4 py-3"
							>
								<span>{label}</span>
								<Toggle
									className="shrink-0"
									ariaLabel={label}
									value={settings[key]}
									disabled={settings.isLoading || settings.isSaving}
									onChange={(value) => settings.setSetting(key, value)}
								/>
							</div>
						))}
					</div>
					{settings.isLoading && (
						<p className="text-sm text-muted">Загрузка настроек…</p>
					)}
					{settings.error && (
						<div role="alert" className="mt-3 text-sm text-destructive">
							<p>{settings.error}</p>
							<button
								type="button"
								className="mt-2 underline"
								onClick={settings.retry}
							>
								Повторить загрузку
							</button>
						</div>
					)}
				</section>
			</ModalRoot>
		</>
	)
}
