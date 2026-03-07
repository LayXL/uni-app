import { useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

export function useCoverUpload(initialUrl?: string) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [coverUrl, setCoverUrl] = useState<string | null>(initialUrl ?? null)
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const selectFile = async (fileList: FileList | null) => {
		const file = fileList?.[0]
		if (!file) return

		setUploadError(null)
		setIsUploading(true)

		try {
			const result = await orpc.events.uploadCover.call({ file })
			setCoverUrl(result.url)
		} catch {
			setUploadError("Не удалось загрузить обложку")
		} finally {
			setIsUploading(false)
		}

		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	const removeCover = () => setCoverUrl(null)

	const openFilePicker = () => fileInputRef.current?.click()

	return {
		coverUrl,
		fileInputRef,
		isUploading,
		uploadError,
		selectFile,
		removeCover,
		openFilePicker,
	}
}
