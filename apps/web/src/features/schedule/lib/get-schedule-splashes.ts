import { format } from "date-fns"

import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

export type SplashGroup = {
	id: number
	displayName: string
	type: "studentsGroup" | "teacher"
}

export const generalScheduleSplashes = [
	"квест: не проспать",
	"спавн у первой пары",
	"сохраниться перед парой?",
	"сон временно недоступен",
	"твой лут — конспекты",
	"ещё пять минуточек?",
	"загружаем режим студента",
	"проверим, куда бежать?",
	"как у тебя дела?",
	"мяу",
	"ня-ня-ня-ня-ня",
	"неопознанный нян-кэт",
	"wow",
	"да",
	"твори добро",
	"обернись",
	"улыбнись",
	"не свисти",
	"console.log(2+2)",
	"приложение сделано с душой",
	"может блинчиков потом?",
	"спать хочется...",
	"не забывай делать перерывы",
	"ду ю спик инглиш?",
	"приложение было сделано, потому что было скучно",
	"чай, кофе, потанцуем?",
	"welcome back",
	"с днем хлеба",
	"завтра будет через день",
	"давай поедим вместе",
	"не волнуйся",
	"кушать хочется",
	"а может лучше поспать?",
	"чем займёшься сегодня?",
	"что делаешь?",
	"студенты любят меня, ведь я знаю когда у них пары",
	"ты кто?",
	"спасибо, что ты есть",
	"с днём дня",
	"с днём соленого огурца",
	"пей побольше воды",
	"кофе или чай? чай или кофе?",
	"вся жизнь впереди",
	"иногда всем бывает грустно. это пройдёт",
	"улыбайся чаще",
	"ты вампир?",
	"всё лето сидеть дома",
	"даже тут реклама авиасейлс...",
	"выглядишь бомбически",
	"грустить тоже надо уметь",
	"не забудь сказать кому-нибудь что-то хорошее сегодня",
	"не забудь сказать кому-нибудь комплимент",
	"знаешь свою натальную карту?",
	"мне не важно кто ты по зз",
	"а вдруг мы в симуляции?",
	"поиграем?",
	"что-что говоришь?",
	"ого",
	"твоя улыбка растопит даже антарктиду",
	"твой упорный труд и целеустремленность в конце концов окупятся",
	"сегодняшний день — твоё поле для достижений. начнём!",
	"давай создавать незабываемые моменты",
	"море позитива",
	"с какой ноги встали?",
	"давай сделаем этот день неповторимым",
	"не выгораем",
	"тут могла быть ваша реклама",
	"райс энд шайн",
	"тебе идут ямочки",
	"дай им жару!",
	"покажи им стиль!",
	"ты тоже чувствуешь это?",
	"ну че, как там с деньгами?",
	"ты сильный человек, который справится со всем",
	"хватай метлу и летим на шабаш",
	"завтра семь пар! испугался?",
	"ты зашёл. я растерялось",
	"староста печатает…",
	"я не списываю. я синхронизируюсь",
	"пропускать нельзя присутствовать",
	"пары — это сезонный контент",
	"здесь могла быть мотивация",
	"план надёжный. деталей нет",
	"ничего не трогай. работает",
	"ты это тоже видишь?",
	"я просто показываю пары",
	"не спрашивай откуда я знаю",
	"здесь безопасно. наверное",
	"так было задумано кафедрой",
	"одногруппник покинул сервер",
	"неосознанный динозавр",
	"неопознанный енот",
	"промпт сдан вместо курсовой",
	"гг вп!",
	"скачать мод на деньги без смс",
	"скачать мод на сбербанк бесплатно",
	"motherlode",
	"motherlode не сработал",
	"я обманываю",
	"сикс севен",
	"кто-то уже пишет диплом. ужас",
	"увидел чужой github. день испорчен",
] as const

const timeToMinutes = (time: string) => {
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
	const [hours, minutes] = time.split(":").map(Number)
	return hours * 60 + minutes
}

// `now` is the campus wall-clock time (Asia/Yekaterinburg).
export const getScheduleSplashes = ({
	group,
	schedule,
	now,
}: {
	group: SplashGroup
	schedule?: readonly Lesson[]
	now: Date
}): string[] => {
	const splashes: string[] = [...generalScheduleSplashes]
	if (now.getDay() === 0) splashes.push("сохранение перед понедельником")
	if (group.type !== "studentsGroup") return splashes

	const course = Number(transformToGroupName(group).match(/\d/)?.[0])
	if (course >= 1) {
		splashes.push(`на ${course}-м курсе весело, да?`)
	}
	if (course === 1) splashes.push("первый курс? добро пожаловать в квест")
	if (course === 3) splashes.push("третий курс. ты знаешь слишком много")
	if (course === 4) splashes.push("4-й курс и не знаешь расписание?")

	// Missing/failed data must never be interpreted as a day off.
	if (!schedule) return splashes
	const today = format(now, "yyyy-MM-dd")
	const todayLessons = schedule.filter((lesson) => lesson.date === today)
	const activeLessons = todayLessons.filter((lesson) => !lesson.isCancelled)
	const orders = [...new Set(activeLessons.map((lesson) => lesson.order))].sort(
		(a, b) => a - b,
	)
	const count = orders.length

	if (count >= 4) splashes.push("многовато пар сегодня")
	if (count >= 1 && count <= 2) splashes.push("сегодня чилл")
	if (count === 1) splashes.push("одна пара — и свобода")
	if (count === 0) splashes.push("сегодня без пар. серьёзно")
	if (
		todayLessons.some(
			(lesson) => lesson.isCancelled && !orders.includes(lesson.order),
		)
	) {
		splashes.push("минус пара, плюс настроение")
	}
	if (count > 0 && activeLessons.every((lesson) => lesson.isDistance)) {
		splashes.push("сегодня учимся из пледа")
	}
	if (count === 0) return splashes

	const intervals = activeLessons.map((lesson) => ({
		order: lesson.order,
		start: timeToMinutes(lesson.startTime),
		end: timeToMinutes(lesson.endTime),
	}))
	if (
		intervals.some(
			({ start, end }) => start === null || end === null || end <= start,
		)
	) {
		return splashes
	}

	// Parallel subjects/subgroups in the same slot still count as one pair.
	const slots = orders.map((order) => {
		const items = intervals.filter((item) => item.order === order)
		return {
			order,
			start: Math.min(...items.map((item) => item.start as number)),
			end: Math.max(...items.map((item) => item.end as number)),
		}
	})
	const minutes = now.getHours() * 60 + now.getMinutes()
	const firstStart = Math.min(...slots.map((slot) => slot.start))
	const lastEnd = Math.max(...slots.map((slot) => slot.end))
	if (minutes < firstStart) {
		if (firstStart <= 9 * 60) splashes.push("первая пара? сочувствую")
		if (firstStart >= 10 * 60) splashes.push("можно поспать подольше")
	}
	if (
		!slots.some((slot) => slot.start <= minutes && minutes < slot.end) &&
		slots.some((slot, index) => {
			const next = slots[index + 1]
			return (
				next &&
				next.order > slot.order + 1 &&
				minutes >= slot.end &&
				minutes < next.start
			)
		})
	) {
		splashes.push("окно в расписании. проветримся?")
	}
	if (
		minutes >= firstStart &&
		slots.filter((slot) => slot.end > minutes).length === 1
	) {
		splashes.push("последняя пара — финальный босс")
	}
	if (minutes >= lastEnd) splashes.push("на сегодня всё. выдыхай")
	if (now.getDay() === 5 && minutes < lastEnd) {
		splashes.push("пятница, но есть нюанс")
	}
	return splashes
}
