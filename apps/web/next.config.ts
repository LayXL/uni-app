import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: false,
	reactCompiler: true,
	devIndicators: false,
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
					{
						key: "Access-Control-Allow-Credentials",
						value: "true",
					},
				],
			},
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
			{
				source: "/images/secretscode-channel-v2.webp",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
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
