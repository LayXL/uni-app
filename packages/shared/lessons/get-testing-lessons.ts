import { differenceInCalendarDays, parseISO } from "date-fns"

import { TESTING_GROUP_DISPLAY_NAME, TESTING_GROUP_ID } from "../testing-group"
import type { Lesson } from "./types/lesson"

type TestingLessonTemplate = Omit<Lesson, "date" | "startTime" | "endTime">

const ANCHOR_DATE = "2026-01-05"

const testingGroup = {
	id: TESTING_GROUP_ID,
	displayName: TESTING_GROUP_DISPLAY_NAME,
	type: "studentsGroup" as const,
}

const createTestingLesson = (
	order: number,
	subject: { id: number; name: string },
	classroom: string,
): TestingLessonTemplate => ({
	order,
	classroom,
	isCancelled: false,
	isDistance: false,
	isChanged: false,
	original: null,
	subject,
	groups: [testingGroup],
})

const testingScheduleByDay: TestingLessonTemplate[][] = [
	[
		createTestingLesson(
			1,
			{ id: -101, name: "Тестирование интерфейсов" },
			"201",
		),
		createTestingLesson(2, { id: -102, name: "Основы аналитики" }, "305"),
	],
	[
		createTestingLesson(2, { id: -103, name: "Проектный практикум" }, "410"),
		createTestingLesson(3, { id: -104, name: "Командная разработка" }, "408"),
	],
	[
		createTestingLesson(
			1,
			{ id: -105, name: "Дизайн цифровых сервисов" },
			"214",
		),
		createTestingLesson(4, { id: -106, name: "Базы данных" }, "312"),
	],
	[
		createTestingLesson(2, { id: -107, name: "Frontend-разработка" }, "508"),
		createTestingLesson(3, { id: -108, name: "Backend-разработка" }, "509"),
	],
	[
		createTestingLesson(1, { id: -109, name: "Архитектура приложений" }, "401"),
		createTestingLesson(
			2,
			{ id: -110, name: "Защита тестового проекта" },
			"Актовый зал",
		),
	],
	[],
	[],
	[
		createTestingLesson(2, { id: -111, name: "Мобильная разработка" }, "307"),
		createTestingLesson(3, { id: -112, name: "Практика тестирования" }, "307"),
	],
	[
		createTestingLesson(1, { id: -113, name: "Алгоритмы" }, "202"),
		createTestingLesson(4, { id: -114, name: "UX-исследования" }, "215"),
	],
	[
		createTestingLesson(
			2,
			{ id: -115, name: "Интеграционные сценарии" },
			"406",
		),
		createTestingLesson(3, { id: -116, name: "Документирование API" }, "406"),
	],
	[
		createTestingLesson(1, { id: -117, name: "DevOps-практикум" }, "512"),
		createTestingLesson(
			2,
			{ id: -118, name: "Информационная безопасность" },
			"514",
		),
	],
	[
		createTestingLesson(
			3,
			{ id: -119, name: "Демонстрационный экзамен" },
			"Большой зал",
		),
	],
	[],
	[],
]

const getTestingDayIndex = (date: string) => {
	const daysFromAnchor = differenceInCalendarDays(
		parseISO(date),
		parseISO(ANCHOR_DATE),
	)
	return ((daysFromAnchor % 14) + 14) % 14
}

export const getTestingLessons = (
	dates: string[],
	options: { classrooms?: string[] } = {},
): Lesson[] =>
	dates.flatMap((date) => {
		const lessons = testingScheduleByDay[getTestingDayIndex(date)].filter(
			(lesson) =>
				!options.classrooms?.length ||
				options.classrooms.includes(lesson.classroom),
		)

		return lessons.map((lesson) => ({
			...lesson,
			date,
			startTime: "",
			endTime: "",
		}))
	})
