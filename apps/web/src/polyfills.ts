if (!Array.prototype.toReversed) {
	Object.defineProperty(Array.prototype, "toReversed", {
		configurable: true,
		writable: true,
		value: function toReversed<T>(this: T[]) {
			return Array.from(this).reverse()
		},
	})
}

if (!Array.prototype.toSorted) {
	Object.defineProperty(Array.prototype, "toSorted", {
		configurable: true,
		writable: true,
		value: function toSorted<T>(this: T[], compareFn?: (a: T, b: T) => number) {
			return Array.from(this).sort(compareFn)
		},
	})
}

if (!String.prototype.replaceAll) {
	Object.defineProperty(String.prototype, "replaceAll", {
		configurable: true,
		writable: true,
		value: function replaceAll(
			this: string,
			searchValue: string | RegExp,
			replaceValue:
				| string
				| ((substring: string, ...args: unknown[]) => string),
		) {
			if (searchValue instanceof RegExp) {
				if (!searchValue.global) {
					throw new TypeError("replaceAll requires a global RegExp")
				}

				return this.replace(searchValue, replaceValue as never)
			}

			const escapedSearchValue = String(searchValue).replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&",
			)

			return this.replace(
				new RegExp(escapedSearchValue, "g"),
				replaceValue as never,
			)
		},
	})
}
