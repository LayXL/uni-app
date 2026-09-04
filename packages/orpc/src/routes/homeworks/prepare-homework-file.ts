import { ORPCError } from "@orpc/client"
import sharp from "sharp"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

export async function prepareHomeworkFile(file: File) {
	if (file.size > MAX_FILE_SIZE) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Размер файла превышает 5 МБ",
		})
	}

	if (!ALLOWED_MIME_TYPES.has(file.type)) {
		throw new ORPCError("BAD_REQUEST", {
			message:
				"Недопустимый тип файла. Разрешены изображения и документы (PDF, Word, PowerPoint, Excel)",
		})
	}

	let buffer: Buffer = Buffer.from(await file.arrayBuffer())
	let name = file.name
	let mimeType = file.type

	if (file.type.startsWith("image/")) {
		try {
			buffer = await sharp(buffer, { animated: true })
				.autoOrient()
				.webp({ quality: 90 })
				.toBuffer()
		} catch {
			throw new ORPCError("BAD_REQUEST", {
				message: "Не удалось обработать изображение",
			})
		}

		name = `${file.name.replace(/\.[^.]+$/, "") || "image"}.webp`
		mimeType = "image/webp"
	}

	if (buffer.length > MAX_FILE_SIZE) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Размер файла после обработки превышает 5 МБ",
		})
	}

	return { buffer, name, mimeType, size: buffer.length }
}
