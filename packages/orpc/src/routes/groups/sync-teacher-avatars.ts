import { PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

import { getUserPhoto } from "@repo/bitrix/user/get-user-photo"

import { getS3Bucket, getS3Client } from "../../lib/s3"

type Teacher = { id: number; bitrixId: string }

export async function syncTeacherAvatars(teachers: Teacher[], cookie: string) {
	const result = { uploaded: 0, skipped: 0, failed: 0 }
	// Resolve configuration once, even when no teacher has a photo.
	const client = getS3Client()
	const bucket = getS3Bucket()

	for (const [index, teacher] of teachers.entries()) {
		if (index > 0) await new Promise((resolve) => setTimeout(resolve, 100))
		try {
			const userId = Number(teacher.bitrixId)
			if (!Number.isSafeInteger(userId) || userId <= 0) {
				throw new Error("Invalid Bitrix teacher ID")
			}
			const photo = await getUserPhoto(userId, cookie)
			if (!photo) {
				result.skipped++
				continue
			}

			const webp = await sharp(photo, { limitInputPixels: 40_000_000 })
				.rotate()
				.resize({
					width: 512,
					height: 512,
					fit: "inside",
					withoutEnlargement: true,
				})
				.webp({ quality: 85 })
				.toBuffer()

			await client.send(
				new PutObjectCommand({
					Bucket: bucket,
					Key: `teachers/avatars/${teacher.id}.webp`,
					Body: webp,
					ContentType: "image/webp",
					CacheControl: "public, max-age=3600",
				}),
				{ abortSignal: AbortSignal.timeout(30_000) },
			)
			result.uploaded++
		} catch (error) {
			result.failed++
			// biome-ignore lint/suspicious/noConsole: Isolated avatar failures must remain visible to operators.
			console.error("Failed to synchronize teacher avatar", {
				groupId: teacher.id,
				bitrixId: teacher.bitrixId,
				error: error instanceof Error ? error.message : "Unknown error",
			})
		}
	}

	return result
}
