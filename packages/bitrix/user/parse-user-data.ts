import parse from "node-html-parser"

export function parseUserData(html: string) {
	const root = parse(html)
	const profile = root.querySelector("#emp-profile")
	if (!profile) throw new Error("Bitrix user profile is missing")

	const style = profile.getAttribute("style") ?? ""
	const photoPath = style.match(
		/background-image\s*:\s*url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/i,
	)

	return {
		name: root.querySelector(".emp-profile-name")?.innerText,
		photoPath: photoPath?.[1] ?? photoPath?.[2] ?? photoPath?.[3] ?? null,
	}
}
