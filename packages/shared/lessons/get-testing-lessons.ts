import { differenceInCalendarDays, parseISO } from "date-fns"

import type { BuildingScheme } from "../building-scheme"
import { isRoom } from "../building-scheme"
import {
	TESTING_GROUP_DISPLAY_NAME,
	TESTING_GROUP_ID,
	testingTeacherGroups,
} from "../testing-group"
import type { Lesson } from "./types/lesson"

type TestingLessonTemplate = Omit<Lesson, "date" | "startTime" | "endTime">
type TestingLessonSeed = {
	order: number
	subject: { id: number; name: string }
	roomIndex: number
	teacherIndex: number
}

const ANCHOR_DATE = "2026-01-05"

const testingGroup = {
	id: TESTING_GROUP_ID,
	displayName: TESTING_GROUP_DISPLAY_NAME,
	type: "studentsGroup" as const,
}

const testingScheduleByDay: TestingLessonSeed[][] = [
	[
		{
			order: 1,
			subject: { id: -101, name: "Тестирование интерфейсов" },
			roomIndex: 0,
			teacherIndex: 0,
		},
		{
			order: 2,
			subject: { id: -102, name: "Основы аналитики" },
			roomIndex: 1,
			teacherIndex: 1,
		},
	],
	[
		{
			order: 2,
			subject: { id: -103, name: "Проектный практикум" },
			roomIndex: 2,
			teacherIndex: 2,
		},
		{
			order: 3,
			subject: { id: -104, name: "Командная разработка" },
			roomIndex: 3,
			teacherIndex: 3,
		},
	],
	[
		{
			order: 1,
			subject: { id: -105, name: "Дизайн цифровых сервисов" },
			roomIndex: 4,
			teacherIndex: 0,
		},
		{
			order: 4,
			subject: { id: -106, name: "Базы данных" },
			roomIndex: 5,
			teacherIndex: 1,
		},
	],
	[
		{
			order: 2,
			subject: { id: -107, name: "Frontend-разработка" },
			roomIndex: 6,
			teacherIndex: 2,
		},
		{
			order: 3,
			subject: { id: -108, name: "Backend-разработка" },
			roomIndex: 7,
			teacherIndex: 3,
		},
	],
	[
		{
			order: 1,
			subject: { id: -109, name: "Архитектура приложений" },
			roomIndex: 8,
			teacherIndex: 0,
		},
		{
			order: 2,
			subject: { id: -110, name: "Защита тестового проекта" },
			roomIndex: 9,
			teacherIndex: 1,
		},
	],
	[],
	[],
	[
		{
			order: 2,
			subject: { id: -111, name: "Мобильная разработка" },
			roomIndex: 10,
			teacherIndex: 2,
		},
		{
			order: 3,
			subject: { id: -112, name: "Практика тестирования" },
			roomIndex: 10,
			teacherIndex: 3,
		},
	],
	[
		{
			order: 1,
			subject: { id: -113, name: "Алгоритмы" },
			roomIndex: 11,
			teacherIndex: 0,
		},
		{
			order: 4,
			subject: { id: -114, name: "UX-исследования" },
			roomIndex: 12,
			teacherIndex: 1,
		},
	],
	[
		{
			order: 2,
			subject: { id: -115, name: "Интеграционные сценарии" },
			roomIndex: 13,
			teacherIndex: 2,
		},
		{
			order: 3,
			subject: { id: -116, name: "Документирование API" },
			roomIndex: 13,
			teacherIndex: 3,
		},
	],
	[
		{
			order: 1,
			subject: { id: -117, name: "DevOps-практикум" },
			roomIndex: 14,
			teacherIndex: 0,
		},
		{
			order: 2,
			subject: { id: -118, name: "Информационная безопасность" },
			roomIndex: 15,
			teacherIndex: 1,
		},
	],
	[
		{
			order: 3,
			subject: { id: -119, name: "Демонстрационный экзамен" },
			roomIndex: 16,
			teacherIndex: 2,
		},
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

const getSchedulableClassrooms = (buildingScheme: BuildingScheme) =>
	buildingScheme.entities
		.filter(isRoom)
		.map((room) => room.name)
		.filter((name) => /^\d{3}[А-ЯA-Z]?$/.test(name))

const createTestingLesson = (
	seed: TestingLessonSeed,
	classrooms: string[],
): TestingLessonTemplate => {
	const teacher = testingTeacherGroups[seed.teacherIndex]

	return {
		order: seed.order,
		classroom: classrooms[seed.roomIndex % classrooms.length] ?? "219",
		isCancelled: false,
		isDistance: false,
		isChanged: false,
		original: null,
		subject: seed.subject,
		groups: [
			testingGroup,
			{
				id: teacher.id,
				displayName: teacher.displayName,
				type: teacher.type,
			},
		],
	}
}

export const getTestingLessons = (
	dates: string[],
	options: {
		buildingScheme: BuildingScheme
		group?: number
		classrooms?: string[]
	},
): Lesson[] =>
	dates.flatMap((date) => {
		const scheduleClassrooms = getSchedulableClassrooms(options.buildingScheme)
		const lessons = testingScheduleByDay[getTestingDayIndex(date)]
			.map((seed) => createTestingLesson(seed, scheduleClassrooms))
			.filter(
				(lesson) =>
					options.group === undefined ||
					lesson.groups.some((group) => group.id === options.group),
			)
			.filter(
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
