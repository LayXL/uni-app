export function isRequestAbort(error: unknown, signal: AbortSignal) {
	if (!signal.aborted) return false
	return (
		error === signal.reason ||
		(error instanceof Error && error.name === "AbortError")
	)
}
