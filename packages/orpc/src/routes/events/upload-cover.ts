import { randomUUID } from "node:crypto"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { ORPCError } from "@orpc/client"
import sharp from "sharp"
import z from "zod"

import { getPublicUrl, getS3Bucket, getS3Client } from "../../lib/s3"
import { privateProcedure } from "../../procedures/private"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
])

export const uploadCover = privateProcedure
	.input(
		z.object({
			file: z.instanceof(File),
		}),
	)
	.handler(async ({ input, context }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		const { file } = input

		if (file.size > MAX_FILE_SIZE) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Размер файла превышает 10 МБ",
			})
		}

		if (!ALLOWED_MIME_TYPES.has(file.type)) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"Недопустимый тип файла. Разрешены изображения (JPEG, PNG, GIF, WebP, AVIF)",
			})
		}

		const raw = Buffer.from(await file.arrayBuffer())

		const compressed = await sharp(raw).webp({ quality: 90 }).toBuffer()

		const key = `events/covers/${randomUUID()}.webp`

		await getS3Client().send(
			new PutObjectCommand({
				Bucket: getS3Bucket(),
				Key: key,
				Body: compressed,
				ContentType: "image/webp",
			}),
		)

		return {
			url: getPublicUrl(key),
		}
	})
