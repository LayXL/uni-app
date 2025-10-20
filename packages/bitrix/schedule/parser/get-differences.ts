type Object = Record<string, unknown>

export function getDifferences(obj1: Object, obj2: Object) {
	const differences: Object = {}

	for (const key in obj2) {
		if (obj2[key] !== obj1[key]) {
			differences[key] = obj2[key]
		}
	}

	return differences
}
