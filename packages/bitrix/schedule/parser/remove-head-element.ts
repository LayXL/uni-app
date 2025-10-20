export function removeHeadElement(input: string): string {
	return input.replace(/<head[\s\S]*?<\/head>/i, "")
}
