import { env } from "@repo/env"

import { getUserData } from "./get-user-data"

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export async function getUserPhoto(userId: number, cookie: string) {
	const { photoPath } = await getUserData(userId, cookie)
	if (!photoPath) return null

	const base = new URL(env.bitrixUrl)
	const url = new URL(photoPath, base)
	// Only uploaded photos, not Bitrix's default avatar or an external URL.
	if (
		url.origin !== base.origin ||
		!url.pathname.startsWith("/upload/") ||
		url.username ||
		url.password
	) {
		return null
	}

	const response = await fetch(url, {
		headers: { Cookie: cookie },
		redirect: "error",
		signal: AbortSignal.timeout(30_000),
	})
	if (!response.ok) throw new Error(`Bitrix photo HTTP ${response.status}`)
	if (!response.headers.get("content-type")?.startsWith("image/")) {
		await response.body?.cancel()
		throw new Error("Bitrix photo response is not an image")
	}
	if (Number(response.headers.get("content-length")) > MAX_PHOTO_BYTES) {
		await response.body?.cancel()
		throw new Error("Bitrix photo exceeds 10 MB")
	}

	const reader = response.body?.getReader()
	if (!reader) throw new Error("Bitrix photo response is empty")
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			size += value.byteLength
			if (size > MAX_PHOTO_BYTES) {
				await reader.cancel()
				throw new Error("Bitrix photo exceeds 10 MB")
			}
			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}
	return Buffer.concat(chunks)
}
