import { InlineKeyboard } from "grammy"

import {
	and,
	arrayContains,
	asc,
	classesTable,
	db,
	eq,
	isNotNull,
	subjectsTable,
	usersTable,
} from "@repo/drizzle"
import { env } from "@repo/env"
import { cutSubjectName } from "@repo/shared/subjects/cut-subject-name"

import { bot } from "../bot"

const YEKATERINBURG_TIMEZONE = "Asia/Yekaterinburg"
const CHECK_INTERVAL_MS = 60_000
const SEND_HOUR = 18
const openMiniAppInlineKeyboard = new InlineKeyboard().webApp(
	"🚀 Открыть расписание",
	env.webAppUrl,
)

type SendDailySchedulesResult = {
	status: "sent" | "skippedByTime" | "alreadySentToday" | "alreadyRunning"
	sentCount: number
	targetDate: string
}

let isSchedulerStarted = false
let isSending = false
let lastSentDate: string | null = null

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: YEKATERINBURG_TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
	timeZone: YEKATERINBURG_TIMEZONE,
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
})

const humanDateFormatter = new Intl.DateTimeFormat("ru-RU", {
	timeZone: YEKATERINBURG_TIMEZONE,
	day: "numeric",
	month: "long",
})

const getYekaterinburgDate = () => {
	return dateFormatter.format(new Date())
}

const getYekaterinburgHour = () => {
	return Number(timeFormatter.format(new Date()).slice(0, 2))
}

const getNextDate = (date: string) => {
	const [year, month, day] = date.split("-").map(Number)
	const nextDay = new Date(Date.UTC(year, month - 1, day))
	nextDay.setUTCDate(nextDay.getUTCDate() + 1)
	return nextDay.toISOString().slice(0, 10)
}

const escapeHtml = (value: string) => {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
}

const formatHumanDate = (date: string) => {
	const [year, month, day] = date.split("-").map(Number)
	return humanDateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

const formatOrderAsEmojiNumber = (order: number) => {
	const keycapByDigit: Record<string, string> = {
		"0": "0️⃣",
		"1": "1️⃣",
		"2": "2️⃣",
		"3": "3️⃣",
		"4": "4️⃣",
		"5": "5️⃣",
		"6": "6️⃣",
		"7": "7️⃣",
		"8": "8️⃣",
		"9": "9️⃣",
	}

	return String(order)
		.split("")
		.map((digit) => keycapByDigit[digit] ?? digit)
		.join("")
}

const getScheduleForGroup = async (groupId: number, date: string) => {
	return db
		.select({
			order: classesTable.order,
			classroom: classesTable.classroom,
			subjectName: subjectsTable.name,
			isCancelled: classesTable.isCancelled,
			isDistance: classesTable.isDistance,
		})
		.from(classesTable)
		.innerJoin(subjectsTable, eq(classesTable.subject, subjectsTable.id))
		.where(
			and(
				eq(classesTable.date, date),
				arrayContains(classesTable.groups, [groupId]),
			),
		)
		.orderBy(asc(classesTable.order))
}

const formatScheduleMessage = async (
	groupId: number,
	date: string,
): Promise<string | null> => {
	const schedule = await getScheduleForGroup(groupId, date)

	if (schedule.length === 0) {
		return null
	}

	const lessons = schedule
		.map((lesson) => {
			const statuses = [
				lesson.isCancelled ? "отменена" : null,
				lesson.isDistance ? "дистант" : null,
			].filter(Boolean)

			const status = statuses.length > 0 ? ` (${statuses.join(", ")})` : ""

			return `${formatOrderAsEmojiNumber(lesson.order)} ${escapeHtml(cutSubjectName(lesson.subjectName))}${status}\n📍 ${escapeHtml(lesson.classroom)}`
		})
		.join("\n\n")

	return `<b>Расписание на ${formatHumanDate(date)}</b>\n\n${lessons}`
}

const sendDailySchedules = async (options?: {
	force?: boolean
	date?: string
}): Promise<SendDailySchedulesResult> => {
	const force = options?.force ?? false

	if (isSending) {
		return {
			status: "alreadyRunning",
			sentCount: 0,
			targetDate: options?.date ?? getNextDate(getYekaterinburgDate()),
		}
	}

	const today = getYekaterinburgDate()
	const hour = getYekaterinburgHour()

	if (!force && hour < SEND_HOUR) {
		return {
			status: "skippedByTime",
			sentCount: 0,
			targetDate: options?.date ?? getNextDate(today),
		}
	}

	if (!force && lastSentDate === today) {
		return {
			status: "alreadySentToday",
			sentCount: 0,
			targetDate: options?.date ?? getNextDate(today),
		}
	}

	isSending = true
	let sentCount = 0

	try {
		const users = await db
			.select({
				telegramId: usersTable.telegramId,
				group: usersTable.group,
			})
			.from(usersTable)
			.where(
				and(
					eq(usersTable.isEnabledNotifications, true),
					isNotNull(usersTable.group),
					isNotNull(usersTable.telegramId),
				),
			)

		const targetDate = options?.date ?? getNextDate(today)
		const messageByGroup = new Map<number, string | null>()

		for (const user of users) {
			if (user.group === null || user.telegramId === null) {
				continue
			}

			if (!messageByGroup.has(user.group)) {
				messageByGroup.set(
					user.group,
					await formatScheduleMessage(user.group, targetDate),
				)
			}

			const message = messageByGroup.get(user.group)

			if (!message) {
				continue
			}

			try {
				await bot.api.sendMessage(user.telegramId, message, {
					parse_mode: "HTML",
					reply_markup: openMiniAppInlineKeyboard,
				})
				sentCount += 1
			} catch {}
		}

		if (!force) {
			lastSentDate = today
		}

		return { status: "sent", sentCount, targetDate }
	} finally {
		isSending = false
	}
}

export const forceSendDailyScheduleNotifications = (date?: string) => {
	return sendDailySchedules({ force: true, date })
}

export const startDailyScheduleNotifications = () => {
	if (isSchedulerStarted) {
		return
	}

	isSchedulerStarted = true
	void sendDailySchedules()
	setInterval(() => void sendDailySchedules(), CHECK_INTERVAL_MS)
}
