export const SPLASH_DURATION_MS = 5_000

export const createScheduleSplashStore = (
	scheduleExpiration: (expire: () => void, delay: number) => void = (
		expire,
		delay,
	) => {
		setTimeout(expire, delay)
	},
) => {
	let title = ""
	const listeners = new Set<() => void>()
	const notify = () => {
		for (const listener of listeners) listener()
	}

	return {
		getSnapshot: () => title,
		getServerSnapshot: () => "",
		subscribe: (listener: () => void) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		start: (candidates: readonly string[]) => {
			if (title || candidates.length === 0) return
			title = candidates[Math.floor(Math.random() * candidates.length)]
			notify()
			scheduleExpiration(() => {
				title = "Расписание"
				notify()
			}, SPLASH_DURATION_MS)
		},
	}
}

// Initialized only from a client effect, never while rendering on the server.
export const scheduleSplashStore = createScheduleSplashStore()
