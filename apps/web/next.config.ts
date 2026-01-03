import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	devIndicators: false,
	experimental: {
		authInterrupts: true,
	},
}

export default nextConfig
