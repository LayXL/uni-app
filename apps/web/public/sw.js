// Retire the old Workbox worker. Keep this URL available for returning users;
// deleting it would leave their previously installed worker in control.
self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			// Only remove the legacy precache for this registration's scope.
			// A storage failure must not prevent the old worker from retiring.
			await Promise.allSettled([
				caches.delete(`workbox-precache-v2-${self.registration.scope}`),
			])
			const windows = await self.clients.matchAll({ type: "window" })
			await self.registration.unregister()
			await Promise.allSettled(
				windows.map((client) => client.navigate(client.url)),
			)
		})(),
	)
})
