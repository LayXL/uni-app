export type HomeworkFile = {
	key: string
	name: string
	size: number
	mimeType: string
	url: string
}

export function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} Б`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
	return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export function isImageMimeType(mimeType: string) {
	return mimeType.startsWith("image/")
}
