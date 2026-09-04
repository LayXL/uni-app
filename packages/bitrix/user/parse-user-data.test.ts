import { describe, expect, test } from "bun:test"

import { parseUserData } from "./parse-user-data"

describe("Bitrix user profile", () => {
	test("extracts the original photo from the profile, not a thumbnail or another user's image", () => {
		const data = parseUserData(`
			<img src="/upload/someone-else.jpg">
			<div id="emp-profile" style="background-color: #df532d; background-image: url('/upload/main/3dc/IMG_0290.JPG'); background-size: auto 100%;">
				<div class="emp-profile-name">Елена Абрамова</div>
			</div>
		`)
		expect(data).toEqual({
			name: "Елена Абрамова",
			photoPath: "/upload/main/3dc/IMG_0290.JPG",
		})
	})

	test("handles CSS quotes and missing photos", () => {
		for (const value of ['"/upload/photo.jpg"', "/upload/photo.jpg"]) {
			expect(
				parseUserData(
					`<div id="emp-profile" style='background-image: url(${value})'></div>`,
				).photoPath,
			).toBe("/upload/photo.jpg")
		}
		expect(parseUserData('<div id="emp-profile"></div>').photoPath).toBeNull()
	})

	test("treats an expired session or unexpected HTML as a failure", () => {
		expect(() =>
			parseUserData('<form action="auth/index.php"></form>'),
		).toThrow("Bitrix user profile is missing")
	})
})
