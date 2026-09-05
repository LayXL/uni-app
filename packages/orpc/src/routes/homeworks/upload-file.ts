import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import z from "zod"

import { getPublicUrl, getS3Bucket, getS3Client } from "../../lib/s3"
import { privateProcedure } from "../../procedures/private"
import { prepareHomeworkFile } from "./prepare-homework-file"

export const uploadFile = privateProcedure
	.input(
		z.object({
			file: z.instanceof(File),
		}),
	)
	.handler(async ({ input }) => {
		const { buffer, name, mimeType, size } = await prepareHomeworkFile(
			input.file,
		)
		const key = `homeworks/${randomUUID()}${extname(name)}`

		await getS3Client().send(
			new PutObjectCommand({
				Bucket: getS3Bucket(),
				Key: key,
				Body: buffer,
				ContentType: mimeType,
			}),
		)

		return {
			key,
			name,
			size,
			mimeType,
			url: getPublicUrl(key),
		}
	})
