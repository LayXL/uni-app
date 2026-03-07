import { S3Client } from "@aws-sdk/client-s3"

import { env } from "@repo/env"

function getS3Config() {
	const { s3Bucket, s3Endpoint, s3AccessKeyId, s3SecretAccessKey } = env

	if (!s3Bucket || !s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
		throw new Error(
			"S3 is not configured. Set S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY in .env",
		)
	}

	return {
		bucket: s3Bucket,
		endpoint: s3Endpoint,
		accessKeyId: s3AccessKeyId,
		secretAccessKey: s3SecretAccessKey,
	}
}

let client: S3Client | null = null

export function getS3Client() {
	if (!client) {
		const config = getS3Config()
		client = new S3Client({
			endpoint: config.endpoint,
			region: "ru-central1",
			forcePathStyle: true,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		})
	}
	return client
}

export function getS3Bucket() {
	return getS3Config().bucket
}

export function getPublicUrl(key: string) {
	const { endpoint, bucket } = getS3Config()
	return `${endpoint}/${bucket}/${key}`
}
