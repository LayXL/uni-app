"use client"

import {
	format,
	getDayOfYear,
	isSameMonth,
	isSameYear,
	parseISO,
} from "date-fns"
import { ru } from "date-fns/locale"
import { useInView } from "motion/react"
import { useRef } from "react"

import { LottiePlayer } from "@/shared/ui/lottie"

const PHRASES = [
	"Ну и хорошо",
	"Вот и день свободный",
	"Можно выдохнуть",
	"Занятия сами взяли выходной",
	"Отличный повод отдохнуть",
	"Можно заняться чем-то другим",
]

const GROUP_PHRASES = [
	...PHRASES,
	"Квест: ничего не проспать. Выполнено",
	"Будильник покинул чат",
	"Можно не искать аудиторию",
	"Спавн под одеялом",
	"Режим студента временно отключён",
	"Пары ушли трогать траву. И ты иди",
	"Расписание пустое, планы грандиозные",
	"План надёжный: чай и плед",
	"Побочный квест: погулять",
	"Сохраниться и отдохнуть",
	"Сон снова доступен",
	"Ещё пять минуточек официально разрешены",
	"Никуда бежать не надо. Непривычно?",
	"Можно позавтракать без спешки",
	"Может, блинчиков?",
	"Чай сам себя не выпьет",
	"Не забудь полить себя водой",
	"Плед уже забронировал тебя",
	"Староста тоже отдыхает. Наверное",
	"Конспект закрыт. Мир открыт",
	"Пары не найдены. Настроение найдено",
	"Это не прогул, это расписание",
	"Лут получен: свободное время",
	"Можно просто побыть котиком",
]

const getPhraseByDate = (date: string) => {
	const phrases = GROUP_PHRASES
	const dayOfYear = getDayOfYear(parseISO(date))
	const phraseIndex = (dayOfYear - 1) % phrases.length

	return phrases[phraseIndex]
}

type WithoutLessonsPlaceholderProps = {
	date: string
	startDate?: string
	isTeacherView?: boolean
}

const getTitle = (startDate: string, endDate: string) => {
	if (startDate === endDate) return "В этот день нет занятий"

	const start = parseISO(startDate)
	const end = parseISO(endDate)
	const sameYear = isSameYear(start, end)
	const startFormat = !sameYear
		? "d MMMM yyyy"
		: isSameMonth(start, end)
			? "d"
			: "d MMMM"
	const endFormat = sameYear ? "d MMMM" : "d MMMM yyyy"

	return `Нет занятий с ${format(start, startFormat, { locale: ru })} по ${format(end, endFormat, { locale: ru })}`
}

const GroupWithoutLessonsPlaceholder = ({
	phrase,
	title,
}: {
	phrase: string
	title: string
}) => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, amount: 0.5 })

	return (
		<div ref={ref} className="flex flex-col items-center px-4 py-6 text-center">
			<div className="mb-3 size-28">
				{isInView && <LottiePlayer src="duck-sunglasses" className="size-28" />}
			</div>
			<h3 className="text-lg font-semibold">{title}</h3>
			<p className="mt-1 text-sm text-muted">{phrase}</p>
		</div>
	)
}

export const WithoutLessonsPlaceholder = ({
	date,
	startDate = date,
	isTeacherView = false,
}: WithoutLessonsPlaceholderProps) => {
	if (isTeacherView) {
		return (
			<p className="px-2 text-left text-sm font-normal">
				В этот день нет занятий
			</p>
		)
	}

	return (
		<GroupWithoutLessonsPlaceholder
			phrase={getPhraseByDate(date)}
			title={getTitle(startDate, date)}
		/>
	)
}
