import type { MapEntity } from "@repo/shared/building-scheme"

const namedMapIcons: Record<string, string> = {
	туалет: "toilet",
	столовая: "food",
	буфет: "food",
	'бистро "апельсин"': "food",
	гардероб: "wardrobe",
	лестница: "stairs",
	магазин: "storefront-outline-24",
	касса: "money-outline-20",
	"отдел кадров": "users-outline-24",
	библиотека: "book-spread-outline-24",
}

const normalize = (text: string) =>
	text.trim().toLocaleLowerCase("ru-RU").replaceAll("ё", "е")

export const getMapEntityLabel = (entity: MapEntity) => {
	const name = normalize(entity.name)
	const description = normalize(entity.description ?? "")
	const title = name.replace(/^\d+[а-яa-z]?\s+/i, "")
	const service = [title, description].find((value) =>
		["касса", "отдел кадров"].includes(value),
	)
	const serviceTitle = service === "касса" ? "Касса" : "Отдел кадров"
	const text =
		service && /^\d+[а-яa-z]?$/i.test(name)
			? `${entity.name.trim()} ${serviceTitle}`
			: entity.name
	const icon =
		entity.icon ??
		namedMapIcons[title] ??
		namedMapIcons[description] ??
		([title, description].some((value) =>
			/^(?:кафедра|преподавательская кафедры)(?:\s|$)/.test(value),
		)
			? "education-outline-24"
			: entity.type === "place"
				? entity.placeType
				: undefined)
	return { text, icon }
}
