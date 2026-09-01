const APP_SESSION_STORAGE_KEY = "uniAppSessionId"
const RESTORED_FEEDBACK_PROMPT_STORAGE_KEY = "restoredFeedbackPromptSessionId"
const DISMISSED_FEEDBACK_PROMPT_STORAGE_KEY = "userFeedbackPromptDismissedUntil"
const FEEDBACK_PROMPT_DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000

let fallbackSessionId: string | undefined
let fallbackRestoredFeedbackPromptSessionId: string | undefined
let fallbackDismissedFeedbackPromptUntil: number | undefined

const createSessionId = () => crypto.randomUUID()

export const getAppSessionId = () => {
	try {
		const storedSessionId = window.sessionStorage.getItem(
			APP_SESSION_STORAGE_KEY,
		)
		if (storedSessionId) return storedSessionId

		const sessionId = createSessionId()
		window.sessionStorage.setItem(APP_SESSION_STORAGE_KEY, sessionId)
		return sessionId
	} catch {
		fallbackSessionId ??= createSessionId()
		return fallbackSessionId
	}
}

export const restoreUserFeedbackPrompt = () => {
	const sessionId = getAppSessionId()

	try {
		window.sessionStorage.setItem(
			RESTORED_FEEDBACK_PROMPT_STORAGE_KEY,
			sessionId,
		)
	} catch {
		fallbackRestoredFeedbackPromptSessionId = sessionId
	}

	try {
		window.localStorage.removeItem(DISMISSED_FEEDBACK_PROMPT_STORAGE_KEY)
	} catch {
		// The in-memory fallback is cleared below.
	}
	fallbackDismissedFeedbackPromptUntil = undefined
}

export const isUserFeedbackPromptRestored = (sessionId: string) => {
	try {
		return (
			window.sessionStorage.getItem(RESTORED_FEEDBACK_PROMPT_STORAGE_KEY) ===
			sessionId
		)
	} catch {
		return fallbackRestoredFeedbackPromptSessionId === sessionId
	}
}

export const dismissUserFeedbackPrompt = () => {
	const dismissedUntil = Date.now() + FEEDBACK_PROMPT_DISMISS_DURATION

	try {
		window.localStorage.setItem(
			DISMISSED_FEEDBACK_PROMPT_STORAGE_KEY,
			String(dismissedUntil),
		)
	} catch {
		fallbackDismissedFeedbackPromptUntil = dismissedUntil
	}
}

export const isUserFeedbackPromptDismissed = () => {
	try {
		const dismissedUntil = Number(
			window.localStorage.getItem(DISMISSED_FEEDBACK_PROMPT_STORAGE_KEY),
		)
		if (dismissedUntil > Date.now()) return true

		window.localStorage.removeItem(DISMISSED_FEEDBACK_PROMPT_STORAGE_KEY)
		return false
	} catch {
		return (fallbackDismissedFeedbackPromptUntil ?? 0) > Date.now()
	}
}
