import { type DragEvent, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import type { HomeworkFile } from "@/entities/homework/types"

export function useFileUpload(initialFiles: HomeworkFile[] = []) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dragDepth = useRef(0)
	const [isDragging, setIsDragging] = useState(false)
	const [files, setFiles] = useState<HomeworkFile[]>(initialFiles)
	const [uploadingCount, setUploadingCount] = useState(0)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const isUploading = uploadingCount > 0

	const selectFiles = async (fileList: FileList | null) => {
		if (!fileList?.length) return
		const selectedFiles = Array.from(fileList)
		setUploadError(null)
		setUploadingCount((c) => c + selectedFiles.length)

		for (const file of selectedFiles) {
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

	const dropzoneProps = {
		onDragEnter: (event: DragEvent<HTMLButtonElement>) => {
			if (!event.dataTransfer.types.includes("Files")) return
			event.preventDefault()
			event.stopPropagation()
			dragDepth.current++
			setIsDragging(true)
		},
		onDragOver: (event: DragEvent<HTMLButtonElement>) => {
			if (!event.dataTransfer.types.includes("Files")) return
			event.preventDefault()
			event.stopPropagation()
			event.dataTransfer.dropEffect = "copy"
		},
		onDragLeave: (event: DragEvent<HTMLButtonElement>) => {
			event.stopPropagation()
			dragDepth.current = Math.max(0, dragDepth.current - 1)
			if (dragDepth.current === 0) setIsDragging(false)
		},
		onDrop: (event: DragEvent<HTMLButtonElement>) => {
			event.preventDefault()
			event.stopPropagation()
			dragDepth.current = 0
			setIsDragging(false)
			void selectFiles(event.dataTransfer.files)
		},
	}

	const removeFile = (key: string) => {
		setFiles((prev) => prev.filter((f) => f.key !== key))
	}

	const openFilePicker = () => fileInputRef.current?.click()

	return {
		files,
		fileInputRef,
		isDragging,
		dropzoneProps,
		uploadingCount,
		isUploading,
		uploadError,
		selectFiles,
		removeFile,
		openFilePicker,
	}
}
