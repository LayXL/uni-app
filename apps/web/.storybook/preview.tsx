import type { Preview } from "@storybook/nextjs-vite"
import type { CSSProperties } from "react"

import "../src/app/globals.css"

const preview: Preview = {
	decorators: [
		(Story, context) => {
			const isDark = context.globals.theme === "dark"

			return (
				<div
					className={isDark ? "dark" : undefined}
					style={
						{
							"--font-inter":
								"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
						} as CSSProperties
					}
				>
					<div className="min-h-screen bg-background text-foreground">
						<Story />
					</div>
				</div>
			)
		},
	],
	globalTypes: {
		theme: {
			description: "Цветовая тема приложения",
			toolbar: {
				icon: "contrast",
				items: [
					{ value: "light", title: "Светлая" },
					{ value: "dark", title: "Тёмная" },
				],
			},
		},
	},
	initialGlobals: {
		theme: "dark",
	},
	parameters: {
		layout: "fullscreen",
		viewport: {
			options: {
				mobile: {
					name: "Mobile 390 × 844",
					styles: { width: "390px", height: "844px" },
					type: "mobile",
				},
			},
		},
	},
}

export default preview
