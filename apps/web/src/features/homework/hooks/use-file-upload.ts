import { useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import type { HomeworkFile } from "@/entities/homework/types"

export function useFileUpload(initialFiles: HomeworkFile[] = []) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [files, setFiles] = useState<HomeworkFile[]>(initialFiles)
	const [uploadingCount, setUploadingCount] = useState(0)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const isUploading = uploadingCount > 0

	const selectFiles = async (fileList: FileList | null) => {
		if (!fileList) return
		setUploadError(null)

		for (const file of Array.from(fileList)) {
			setUploadingCount((c) => c + 1)
			try {
				const result = await orpc.homeworks.uploadFile.call({ file })
				setFiles((prev) => [...prev, result])
			} catch {
				setUploadError(`Не удалось загрузить файл «${file.name}»`)
			} finally {
				setUploadingCount((c) => c - 1)
			}
		}

		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	const removeFile = (key: string) => {
		setFiles((prev) => prev.filter((f) => f.key !== key))
	}

	const openFilePicker = () => fileInputRef.current?.click()

	return {
		files,
		fileInputRef,
		uploadingCount,
		isUploading,
		uploadError,
		selectFiles,
		removeFile,
		openFilePicker,
	}
}
