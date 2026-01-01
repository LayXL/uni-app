const WORDS_TO_CUT = [
	["деятельности", "дея-ти"],
	["современные", "соврем."],
]

const escapeRegExp = (value: string) => {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const withMatchedCase = (replacement: string, source: string) => {
	const first = replacement.charAt(0)
	const rest = replacement.slice(1)

	return source[0] === source[0].toUpperCase()
		? `${first.toUpperCase()}${rest}`
		: replacement
}

export const cutSubjectName = (name: string) => {
	return WORDS_TO_CUT.reduce((acc, [word, replacement]) => {
		const regex = new RegExp(escapeRegExp(word), "gi")

		return acc.replace(regex, (match) => withMatchedCase(replacement, match))
	}, name)
}
