const lowerMap = [
	"йцукенгшщзхъ",
	"qwertyuiop[]",
	"фывапролджэ",
	"asdfghjkl;'",
	"ячсмитьбю.",
	"zxcvbnm,./",
]

const upperMap = [
	"ЙЦУКЕНГШЩЗХЪ",
	"QWERTYUIOP{}",
	"ФЫВАПРОЛДЖЭ",
	'ASDFGHJKL:"',
	"ЯЧСМИТЬБЮ,",
	"ZXCVBNM<>?",
]

function convertLayout(text: string, toRussian: boolean) {
	return text
		.split("")
		.map((char) => {
			const searchIdx = toRussian ? 1 : 0
			const returnIdx = toRussian ? 0 : 1

			for (let i = 0; i < lowerMap.length; i += 2) {
				const idx = lowerMap[i + searchIdx].indexOf(char)
				if (idx !== -1) {
					return lowerMap[i + returnIdx][idx]
				}
			}

			for (let i = 0; i < upperMap.length; i += 2) {
				const idx = upperMap[i + searchIdx].indexOf(char)
				if (idx !== -1) {
					return upperMap[i + returnIdx][idx]
				}
			}

			return char
		})
		.join("")
}

const transform = (str: string) => {
	return convertLayout(
		str.toLocaleLowerCase().replaceAll("ё", "е"),
		true,
	).replace(/[^A-Za-zА-Яа-я0-9]/g, "")
}

export const isInsensitiveMatch = (str1: string, str2: string) => {
	return transform(str1).includes(transform(str2))
}
