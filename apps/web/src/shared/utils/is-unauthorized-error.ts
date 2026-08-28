export const isUnauthorizedError = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	(("code" in error && error.code === "UNAUTHORIZED") ||
		("status" in error && error.status === 401))
