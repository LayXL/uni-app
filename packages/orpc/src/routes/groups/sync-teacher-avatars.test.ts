import { expect, spyOn, test } from "bun:test"
import type { PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"

test("synchronizes WebP by database ID and continues after missing photos and upload failures", async () => {
	const source = await sharp({
		create: { width: 900, height: 600, channels: 3, background: "red" },
	})
		.jpeg()
		.toBuffer()
	const requests: string[] = []
	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		fetch(request) {
			const url = new URL(request.url)
			requests.push(url.pathname + url.search)
			expect(request.headers.get("cookie")).toBe("test-session")
			if (url.pathname === "/mobile/users/") {
				const user = url.searchParams.get("user_id")
				if (user === "2") return new Response('<div id="emp-profile"></div>')
				if (user === "3") return new Response("<form>Login</form>")
				const photo =
					user === "4"
						? "https://external.invalid/upload/photo.jpg"
						: "/upload/photo.jpg"
				return new Response(
					`<div id="emp-profile" style="background-image:url('${photo}')"></div>`,
				)
			}
			return new Response(Uint8Array.from(source).buffer, {
				headers: { "content-type": "image/jpeg" },
			})
		},
	})
	// This test runs against a local portal and a mocked S3 transport only.
	const previousEnv = { ...process.env }
	process.env.NODE_ENV = "development"
	process.env.BITRIX_URL = server.url.href
	process.env.BITRIX_LOGIN = "test"
	process.env.BITRIX_PASSWORD = "test"
	process.env.TELEGRAM_BOT_TOKEN = "test"
	process.env.VK_CLIENT_SECRET = "test"
	process.env.S3_BUCKET = "test"
	process.env.S3_ENDPOINT = "https://s3.invalid"
	process.env.S3_ACCESS_KEY_ID = "test"
	process.env.S3_SECRET_ACCESS_KEY = "test"

	const { getS3Client } = await import("../../lib/s3")
	const send = spyOn(getS3Client(), "send")
		.mockImplementationOnce(() => {
			throw new Error("S3 unavailable")
		})
		.mockResolvedValue({} as never)
	const log = spyOn(console, "error").mockImplementation(() => {})
	try {
		const { syncTeacherAvatars } = await import("./sync-teacher-avatars")
		const teachers = [1, 2, 3, 4, 5].map((id) => ({
			id: 100 + id,
			bitrixId: String(id),
		}))
		const result = await syncTeacherAvatars(teachers, "test-session")
		expect(result).toEqual({ uploaded: 1, skipped: 2, failed: 2 })
		expect(send).toHaveBeenCalledTimes(2)
		const uploaded = (send.mock.calls[1][0] as PutObjectCommand).input
		expect(uploaded.Key).toBe("teachers/avatars/105.webp")
		expect(uploaded.ContentType).toBe("image/webp")
		const metadata = await sharp(uploaded.Body as Buffer).metadata()
		expect(metadata.format).toBe("webp")
		expect(metadata.width).toBe(512)
		expect(metadata.height).toBe(341)
		expect(requests.filter((url) => url === "/upload/photo.jpg")).toHaveLength(
			2,
		)
	} finally {
		send.mockRestore()
		log.mockRestore()
		server.stop(true)
		for (const key of [
			"NODE_ENV",
			"BITRIX_URL",
			"BITRIX_LOGIN",
			"BITRIX_PASSWORD",
			"TELEGRAM_BOT_TOKEN",
			"VK_CLIENT_SECRET",
			"S3_BUCKET",
			"S3_ENDPOINT",
			"S3_ACCESS_KEY_ID",
			"S3_SECRET_ACCESS_KEY",
		]) {
			if (previousEnv[key] === undefined) delete process.env[key]
			else process.env[key] = previousEnv[key]
		}
	}
})
