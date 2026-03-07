import { randomUUID } from "node:crypto"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { ORPCError } from "@orpc/client"
import z from "zod"

import { getPublicUrl, getS3Bucket, getS3Client } from "../../lib/s3"
import { privateProcedure } from "../../procedures/private"

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

export const uploadFile = privateProcedure
	.input(
		z.object({
			file: z.instanceof(File),
		}),
	)
	.handler(async ({ input }) => {
		const { file } = input

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

		const ext = file.name.split(".").pop()
		const key = `homeworks/${randomUUID()}${ext ? `.${ext}` : ""}`

		const buffer = Buffer.from(await file.arrayBuffer())

		await getS3Client().send(
			new PutObjectCommand({
				Bucket: getS3Bucket(),
				Key: key,
				Body: buffer,
				ContentType: file.type,
			}),
		)

		return {
			key,
			name: file.name,
			size: file.size,
			mimeType: file.type,
			url: getPublicUrl(key),
		}
	})
