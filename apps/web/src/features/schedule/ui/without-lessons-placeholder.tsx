import { getDayOfYear, parseISO } from "date-fns"

const PHRASES = [
	"Ну и хорошо",
	"Вот и день свободный",
	"Можно выдохнуть",
	"Занятия сами взяли выходной",
	"Отличный повод отдохнуть",
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
		<div className="p-2 rounded-2xl bg-card border border-border flex flex-col items-center justify-center">
			<p className="font-medium">В этот день нет занятий</p>
			<p className="text-muted text-sm">{phrase}</p>
		</div>
	)
}
