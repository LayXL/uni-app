import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

const appDirectory = fileURLToPath(new URL(".", import.meta.url))
const repositoryDirectory = path.resolve(appDirectory, "../..")

export default defineConfig({
	envDir: repositoryDirectory,
	plugins: [
		tailwindcss(),
		tanstackStart({ spa: { enabled: true } }),
		react({ compiler: true }),
		nitro({
			traceDeps: ["sharp*"],
			rolldownConfig: {
				output: {
					codeSplitting: {
						groups: [
							{
								// Keep Vite's SSR helpers out of application chunks: a router
								// cycle can otherwise call __exportAll before it is initialized.
								name: "ssr-rolldown-runtime",
								test: /\/rolldown-runtime-[^/]+\.js$/,
								priority: 100,
							},
						],
					},
				},
			},
			routeRules: {
				"/**": {
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Credentials": "true",
					},
				},
				"/icons/**": {
					headers: {
						"Content-Type": "image/svg+xml",
						"Cache-Control": "public, max-age=604800, immutable",
					},
				},
				"/images/secretscode-channel-v2.webp": {
					headers: {
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				},
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(appDirectory, "src"),
		},
	},
	ssr: {
		external: ["sharp"],
	},
	server: {
		allowedHosts: ["midis.layxl.dev"],
		host: "0.0.0.0",
	},
	preview: {
		allowedHosts: ["midis.layxl.dev"],
	},
})
