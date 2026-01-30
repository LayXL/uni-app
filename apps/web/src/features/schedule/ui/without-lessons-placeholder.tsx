import { getDayOfYear, parseISO } from "date-fns"

import { LiquidBorder } from "@/shared/ui/liquid-border"

const PHRASES = [
	"Ну и хорошо",
	"Вот и день свободный",
	"Можно выдохнуть",
	"Занятия сами взяли выходной",
	"Отличный повод отдохнуть",
	"Можно заняться чем-то другим",
]

const getPhraseByDate = (date: string) => {
	const dayOfYear = getDayOfYear(parseISO(date))
	const phraseIndex = (dayOfYear - 1) % PHRASES.length

	return PHRASES[phraseIndex]
}

type WithoutLessonsPlaceholderProps = {
	date: string
}

export const WithoutLessonsPlaceholder = ({
	date,
}: WithoutLessonsPlaceholderProps) => {
	const phrase = getPhraseByDate(date)

	return (
		<div className="relative p-2 rounded-3xl bg-card flex flex-col items-center justify-center">
			<LiquidBorder />
			<p className="font-medium">В этот день нет занятий</p>
			<p className="text-muted text-sm">{phrase}</p>
		</div>
	)
}
