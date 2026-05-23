import { randomUUID } from "node:crypto"
import { ORPCError } from "@orpc/client"

import { env } from "@repo/env"
import { getTestingSubjects } from "@repo/shared/lessons/get-testing-lessons"
import { isTestingGroupId, TESTING_GROUP_ID } from "@repo/shared/testing-group"

type TestingUser = {
	id: number
	firstName?: string | null
	lastName?: string | null
}

type TestingHomeworkFile = {
	key: string
	name: string
	size: number
	mimeType: string
	url: string
}

type TestingHomeworkInput = {
	date: string
	subject?: number | null
	deadline: string
	title: string
	description: string
	files: TestingHomeworkFile[]
	isSharedWithWholeGroup: boolean
}

type TestingHomework = {
	id: string
	date: string
	subject: { id: number; name: string } | null
	createdAt: Date
	deadline: Date
	author: number
	authorFirstName: string | null
	authorLastName: string | null
	group: number
	title: string
	description: string
	files: TestingHomeworkFile[]
	isSharedWithWholeGroup: boolean
	isCompleted: boolean
}

const TESTING_HOMEWORK_ID_PREFIX = "testing-homework-"
const testingHomeworkStore = new Map<string, TestingHomework>()
const testingHomeworkCompletions = new Set<string>()
const testingSubjects = getTestingSubjects()

export const isTestingHomeworksRequest = (groupId: number | undefined) =>
	env.testingGroupEnabled && isTestingGroupId(groupId)

export const isTestingHomeworkId = (id: string) =>
	env.testingGroupEnabled && id.startsWith(TESTING_HOMEWORK_ID_PREFIX)

const getCompletionKey = (userId: number, homeworkId: string) =>
	`${userId}:${homeworkId}`

const getTestingSubject = (subjectId: number | null | undefined) => {
	if (subjectId == null) return null

	const subject = testingSubjects.find((subject) => subject.id === subjectId)

	if (!subject) {
		throw new ORPCError("NOT_FOUND", { message: "Предмет не найден" })
	}

	return subject
}

const createDefaultTestingHomeworks = (userId: number): TestingHomework[] => [
	{
		id: `${TESTING_HOMEWORK_ID_PREFIX}default-interface`,
		date: "2026-01-05",
		subject: getTestingSubject(-101),
		createdAt: new Date("2026-01-05T09:00:00.000Z"),
		deadline: new Date("2027-01-12T20:59:59.000Z"),
		author: -1,
		authorFirstName: "Тестовый",
		authorLastName: "Преподаватель",
		group: TESTING_GROUP_ID,
		title: "Проверить экран расписания",
		description:
			"Открыть расписание Т-123, выбрать пару и проверить отображение аудитории и преподавателя.",
		files: [],
		isSharedWithWholeGroup: true,
		isCompleted: testingHomeworkCompletions.has(
			getCompletionKey(
				userId,
				`${TESTING_HOMEWORK_ID_PREFIX}default-interface`,
			),
		),
	},
	{
		id: `${TESTING_HOMEWORK_ID_PREFIX}default-api`,
		date: "2026-01-06",
		subject: getTestingSubject(-115),
		createdAt: new Date("2026-01-06T09:00:00.000Z"),
		deadline: new Date("2027-01-14T20:59:59.000Z"),
		author: -1,
		authorFirstName: "Тестовый",
		authorLastName: "Преподаватель",
		group: TESTING_GROUP_ID,
		title: "Описать сценарий интеграции",
		description:
			"Составить короткое описание ручек, которые нужны для тестового расписания и домашних заданий.",
		files: [],
		isSharedWithWholeGroup: true,
		isCompleted: testingHomeworkCompletions.has(
			getCompletionKey(userId, `${TESTING_HOMEWORK_ID_PREFIX}default-api`),
		),
	},
]

const withCompletion = (homework: TestingHomework, userId: number) => ({
	...homework,
	isCompleted: testingHomeworkCompletions.has(
		getCompletionKey(userId, homework.id),
	),
})

export const getTestingHomeworks = (user: TestingUser) => {
	const now = new Date()

	return [
		...createDefaultTestingHomeworks(user.id),
		...Array.from(testingHomeworkStore.values()).map((homework) =>
			withCompletion(homework, user.id),
		),
	]
		.filter((homework) => homework.deadline >= now)
		.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
}

export const getTestingHomework = (id: string, user: TestingUser) => {
	const homework =
		createDefaultTestingHomeworks(user.id).find(
			(homework) => homework.id === id,
		) ?? testingHomeworkStore.get(id)

	if (!homework) return null

	return withCompletion(homework, user.id)
}

export const createTestingHomework = (
	input: TestingHomeworkInput,
	user: TestingUser,
) => {
	const id = `${TESTING_HOMEWORK_ID_PREFIX}${randomUUID()}`
	const homework: TestingHomework = {
		id,
		date: input.date,
		subject: getTestingSubject(input.subject),
		createdAt: new Date(),
		deadline: new Date(input.deadline),
		author: user.id,
		authorFirstName: user.firstName ?? null,
		authorLastName: user.lastName ?? null,
		group: TESTING_GROUP_ID,
		title: input.title,
		description: input.description,
		files: input.files,
		isSharedWithWholeGroup: input.isSharedWithWholeGroup,
		isCompleted: false,
	}

	testingHomeworkStore.set(id, homework)

	return homework
}

export const updateTestingHomework = (
	id: string,
	input: Partial<TestingHomeworkInput>,
	user: TestingUser,
) => {
	const existing = testingHomeworkStore.get(id)

	if (!existing || existing.author !== user.id) {
		throw new ORPCError("NOT_FOUND", {
			message: "Домашнее задание не найдено",
		})
	}

	const updated: TestingHomework = {
		...existing,
		...(input.date !== undefined && { date: input.date }),
		...(input.subject !== undefined && {
			subject: getTestingSubject(input.subject),
		}),
		...(input.deadline !== undefined && { deadline: new Date(input.deadline) }),
		...(input.title !== undefined && { title: input.title }),
		...(input.description !== undefined && { description: input.description }),
		...(input.files !== undefined && { files: input.files }),
		...(input.isSharedWithWholeGroup !== undefined && {
			isSharedWithWholeGroup: input.isSharedWithWholeGroup,
		}),
	}

	testingHomeworkStore.set(id, updated)

	return withCompletion(updated, user.id)
}

export const deleteTestingHomework = (id: string, user: TestingUser) => {
	const existing = testingHomeworkStore.get(id)

	if (!existing || existing.author !== user.id) {
		throw new ORPCError("NOT_FOUND", {
			message: "Домашнее задание не найдено",
		})
	}

	testingHomeworkStore.delete(id)

	return { success: true }
}

export const toggleTestingHomeworkCompletion = (
	homeworkId: string,
	completed: boolean,
	user: TestingUser,
) => {
	const homework = getTestingHomework(homeworkId, user)

	if (!homework) {
		throw new ORPCError("NOT_FOUND", {
			message: "Домашнее задание не найдено",
		})
	}

	const key = getCompletionKey(user.id, homeworkId)

	if (completed) {
		testingHomeworkCompletions.add(key)
	} else {
		testingHomeworkCompletions.delete(key)
	}

	return { completed }
}
