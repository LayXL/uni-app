import { createFileRoute } from "@tanstack/react-router"

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export const Route = createFileRoute("/auth/vk")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const requestUrl = new URL(request.url)
				const queryString = requestUrl.searchParams.toString()
				const host = request.headers.get("host") ?? "127.0.0.1:3000"
				const protocol = request.headers.get("x-forwarded-proto") ?? "http"
				const headers = new Headers({
					Location: new URL("/", `${protocol}://${host}`).href,
				})

				if (queryString.length > 0) {
					const expires = new Date(Date.now() + ONE_WEEK_IN_SECONDS * 1000)
					headers.append(
						"Set-Cookie",
						`session=${encodeURIComponent(`vkma ${queryString}`)}; Path=/; Expires=${expires.toUTCString()}; Max-Age=${ONE_WEEK_IN_SECONDS}; HttpOnly; SameSite=None; Secure`,
					)
				}

				return new Response(null, { status: 307, headers })
			},
		},
	},
})
