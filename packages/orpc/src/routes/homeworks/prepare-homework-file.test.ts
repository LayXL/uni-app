import { expect, test } from "bun:test"
import sharp from "sharp"

import { prepareHomeworkFile } from "./prepare-homework-file"

test("compresses JPEG to WebP and returns the stored file metadata", async () => {
	const source = await sharp({
		create: { width: 1200, height: 800, channels: 3, background: "white" },
	})
		.jpeg({ quality: 100 })
		.toBuffer()
	const result = await prepareHomeworkFile(
		new File([new Uint8Array(source)], "Задание.страница-1.JPG", {
			type: "image/jpeg",
		}),
	)
	const metadata = await sharp(result.buffer).metadata()

	expect(metadata.format).toBe("webp")
	expect(metadata.width).toBe(1200)
	expect(metadata.height).toBe(800)
	expect(result.name).toBe("Задание.страница-1.webp")
	expect(result.mimeType).toBe("image/webp")
	expect(result.size).toBe(result.buffer.length)
	expect(result.size).toBeLessThan(source.length)
})

test("preserves transparency and handles a filename without an extension", async () => {
	const source = await sharp({
		create: {
			width: 40,
			height: 20,
			channels: 4,
			background: { r: 255, g: 0, b: 0, alpha: 0.5 },
		},
	})
		.png()
		.toBuffer()
	const result = await prepareHomeworkFile(
		new File([new Uint8Array(source)], "Схема", { type: "image/png" }),
	)
	const metadata = await sharp(result.buffer).metadata()
	const pixels = await sharp(result.buffer).raw().toBuffer()

	expect(result.name).toBe("Схема.webp")
	expect(metadata.hasAlpha).toBe(true)
	expect(metadata.width).toBe(40)
	expect(metadata.height).toBe(20)
	expect(pixels[3]).toBe(128)
})

test("applies phone photo orientation before removing EXIF metadata", async () => {
	const source = await sharp({
		create: { width: 80, height: 40, channels: 3, background: "red" },
	})
		.withMetadata({ orientation: 6 })
		.jpeg()
		.toBuffer()
	const result = await prepareHomeworkFile(
		new File([new Uint8Array(source)], "photo.jpg", { type: "image/jpeg" }),
	)
	const metadata = await sharp(result.buffer).metadata()

	expect(metadata.width).toBe(40)
	expect(metadata.height).toBe(80)
	expect(metadata.orientation).toBeUndefined()
})

for (const format of ["gif", "webp"] as const) {
	test(`preserves frames and timing when compressing animated ${format}`, async () => {
		const frames = await Promise.all(
			["red", "blue"].map((background) =>
				sharp({ create: { width: 16, height: 16, channels: 3, background } })
					.png()
					.toBuffer(),
			),
		)
		const source = await sharp(frames, { join: { animated: true } })
			.toFormat(format, { loop: 0, delay: [100, 200] })
			.toBuffer()
		const result = await prepareHomeworkFile(
			new File([new Uint8Array(source)], `animation.${format}`, {
				type: `image/${format}`,
			}),
		)
		const metadata = await sharp(result.buffer, { animated: true }).metadata()

		expect(metadata.format).toBe("webp")
		expect(metadata.pages).toBe(2)
		expect(metadata.pageHeight).toBe(16)
		expect(metadata.delay).toEqual([100, 200])
		expect(metadata.loop).toBe(0)
	})
}

test("keeps documents unchanged", async () => {
	const source = Buffer.from("%PDF-1.7\nHomework document\n%%EOF")
	const result = await prepareHomeworkFile(
		new File([new Uint8Array(source)], "Задание.pdf", {
			type: "application/pdf",
		}),
	)

	expect(result.buffer).toEqual(source)
	expect(result.name).toBe("Задание.pdf")
	expect(result.mimeType).toBe("application/pdf")
	expect(result.size).toBe(source.length)
})

test("rejects invalid images and unsupported file types", async () => {
	await expect(
		prepareHomeworkFile(
			new File(["not an image"], "bad.png", { type: "image/png" }),
		),
	).rejects.toMatchObject({ code: "BAD_REQUEST" })
	await expect(
		prepareHomeworkFile(
			new File(["text"], "notes.txt", { type: "text/plain" }),
		),
	).rejects.toMatchObject({ code: "BAD_REQUEST" })
})

test("preserves the 5 MB input limit", async () => {
	await expect(
		prepareHomeworkFile(
			new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
				type: "image/png",
			}),
		),
	).rejects.toMatchObject({
		code: "BAD_REQUEST",
		message: "Размер файла превышает 5 МБ",
	})
})
