import { env } from "@repo/env"

export function withAvatar<T extends { id: number; type: string }>(group: T) {
	const avatarUrl =
		group.type === "teacher" && group.id > 0 && env.s3Endpoint && env.s3Bucket
			? `${env.s3Endpoint.replace(/\/$/, "")}/${env.s3Bucket}/teachers/avatars/${group.id}.webp`
			: null

	return { ...group, avatarUrl }
}
