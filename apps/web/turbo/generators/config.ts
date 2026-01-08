import fs from "node:fs"
import type { PlopTypes } from "@turbo/gen"

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.setGenerator("icons", {
		description: "Generate icon types",
		prompts: [],
		actions: [
			{
				type: "modify",
				path: "src/types/icon-name.ts",
				transform() {
					const path = "./apps/web/public/icons"
					const files = fs.readdirSync(path)

					return [
						"export type IconName =",
						...files.map((file) => `  | "${file.replace(".svg", "")}"`),
						// biome-ignore lint/suspicious/noTemplateCurlyInString: iconify icons are not supported by the icon component
						"  | `iconify:${string}:${string}`",
						"",
					].join("\n")
				},
			},
		],
	})
}
