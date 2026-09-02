import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	staticDirs: ["../public"],
	viteFinal: async (viteConfig) => ({
		...viteConfig,
		plugins: viteConfig.plugins
			?.flat(Number.POSITIVE_INFINITY)
			.filter((plugin) => {
				const name = plugin && "name" in plugin ? plugin.name : undefined

				return (
					!name?.startsWith("tanstack-start:") &&
					!name?.startsWith("tanstack-router:") &&
					!name?.startsWith("nitro")
				)
			}),
	}),
}

export default config
