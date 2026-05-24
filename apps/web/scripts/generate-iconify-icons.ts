import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const rootDir = process.cwd()
const sourceDir = path.join(rootDir, "apps/web/src")
const outputDir = path.join(rootDir, "apps/web/public/icons/iconify")
const supportedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"])
const iconNamePattern = /iconify:([a-z0-9-]+):([a-z0-9-]+)/gi
const shouldClean = process.argv.includes("--clean")

type IconifyIcon = {
	prefix: string
	name: string
}

const walk = async (dir: string): Promise<string[]> => {
	const entries = await readdir(dir, { withFileTypes: true })
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				return walk(entryPath)
			}

			if (!supportedExtensions.has(path.extname(entry.name))) {
				return []
			}

			return [entryPath]
		}),
	)

	return files.flat()
}

const collectIcons = async () => {
	const files = await walk(sourceDir)
	const icons = new Map<string, IconifyIcon>()

	for (const file of files) {
		const content = await readFile(file, "utf8")
		const matches = content.matchAll(iconNamePattern)

		for (const match of matches) {
			const [, prefix, name] = match
			const key = `${prefix}:${name}`

			icons.set(key, { prefix, name })
		}
	}

	return [...icons.values()].sort((a, b) => {
		const left = `${a.prefix}:${a.name}`
		const right = `${b.prefix}:${b.name}`

		return left.localeCompare(right)
	})
}

const getIconPath = (icon: IconifyIcon) =>
	path.join(outputDir, icon.prefix, `${icon.name}.svg`)

const downloadIcon = async (icon: IconifyIcon) => {
	const response = await fetch(
		`https://api.iconify.design/${icon.prefix}/${icon.name}.svg`,
	)

	if (!response.ok) {
		throw new Error(
			`Failed to download iconify:${icon.prefix}:${icon.name}: ${response.status} ${response.statusText}`,
		)
	}

	const svg = await response.text()

	if (!svg.trim().startsWith("<svg")) {
		throw new Error(
			`Invalid SVG response for iconify:${icon.prefix}:${icon.name}`,
		)
	}

	const iconPath = getIconPath(icon)

	await mkdir(path.dirname(iconPath), { recursive: true })
	await writeFile(iconPath, svg)
}

const main = async () => {
	const icons = await collectIcons()

	if (shouldClean) {
		await rm(outputDir, { recursive: true, force: true })
	}

	if (icons.length === 0) {
		process.stdout.write("No Iconify icons found.\n")
		return
	}

	await Promise.all(icons.map(downloadIcon))

	process.stdout.write(
		`Generated ${icons.length} Iconify icons in ${outputDir}\n`,
	)
}

main().catch((error) => {
	process.stderr.write(`${error}\n`)
	process.exit(1)
})
