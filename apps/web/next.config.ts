import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: true,
	reactCompiler: true,
	allowedDevOrigins: ["http://localhost:3000"],
	experimental: {
		authInterrupts: true,
	},
}

export default nextConfig
