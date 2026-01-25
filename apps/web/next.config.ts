import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	devIndicators: false,
	async headers() {
		return [
			{
				source: "/:path*.svg",
				headers: [
					{
						key: "Content-Type",
						value: "image/svg+xml",
					},
					{
						key: "Cache-Control",
						value: "public, max-age=604800, immutable",
					},
				],
			},
		]
	},
	experimental: {
		authInterrupts: true,
	},
}

export default nextConfig
