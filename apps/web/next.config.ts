import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	experimental: {
		authInterrupts: true,
	},
}

export default nextConfig
