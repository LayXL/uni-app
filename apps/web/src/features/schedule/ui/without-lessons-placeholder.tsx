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
import { cn } from "@/shared/utils/cn"

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
	fillHeight?: boolean
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
	fillHeight,
}: {
	phrase: string
	title: string
	fillHeight: boolean
}) => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, amount: 0.5 })

	return (
		<div
			ref={ref}
			className={cn(
				"flex flex-col items-center px-4 py-6 text-center",
				fillHeight && "flex-1 justify-center",
			)}
		>
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
	fillHeight = false,
}: WithoutLessonsPlaceholderProps) => {
	if (isTeacherView) {
		return (
			<p
				className={cn(
					"px-2 text-left text-sm font-normal",
					fillHeight &&
						"flex flex-1 items-center justify-center py-6 text-center",
				)}
			>
				В этот день нет занятий
			</p>
		)
	}

	return (
		<GroupWithoutLessonsPlaceholder
			fillHeight={fillHeight}
			phrase={getPhraseByDate(date)}
			title={getTitle(startDate, date)}
		/>
	)
}
