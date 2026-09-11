"use client"

import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { analytics } from "@/shared/lib/analytics"

import {
	dismissUserFeedbackPrompt,
	isUserFeedbackPromptDismissed,
	isUserFeedbackPromptRestored,
} from "../lib/get-app-session-id"
import type { UserFeedbackPayload } from "../ui/user-feedback-card"
import { useAppVisit } from "./use-app-visit"

export const useUserFeedbackPrompt = ({ enabled = true } = {}) => {
	const registerVisit = useAppVisit({ enabled })
	const { sessionId } = registerVisit
	const [isRestored, setIsRestored] = useState(false)
	const [isDismissed, setIsDismissed] = useState(false)
	const trackedShownSession = useRef<string | null>(null)
	const submitFeedback = useMutation(
		orpc.feedback.submitFeedback.mutationOptions(),
	)

	useEffect(() => {
		if (!enabled || !sessionId) return
		setIsRestored(isUserFeedbackPromptRestored(sessionId))
		setIsDismissed(isUserFeedbackPromptDismissed())
	}, [enabled, sessionId])

	const shouldShow =
		enabled &&
		registerVisit.isSuccess &&
		!isDismissed &&
		(isRestored || (registerVisit.data?.shouldShow ?? false))

	useEffect(() => {
		if (
			!shouldShow ||
			!sessionId ||
			trackedShownSession.current === sessionId
		) {
			return
		}

		trackedShownSession.current = sessionId
		analytics.track("user_feedback_shown", {
			visit_number: registerVisit.data?.visitCount ?? 2,
		})
	}, [registerVisit.data?.visitCount, sessionId, shouldShow])

	const submit = useCallback(
		async ({ rating, reasons, comment }: UserFeedbackPayload) => {
			if (!sessionId) throw new Error("App session is not ready")

			await submitFeedback.mutateAsync({ rating, reasons, comment, sessionId })
			analytics.track("user_feedback_submitted", {
				rating,
				reasons,
			})
		},
		[sessionId, submitFeedback.mutateAsync],
	)

	const dismiss = useCallback(() => {
		dismissUserFeedbackPrompt()
		setIsDismissed(true)
	}, [])

	return {
		isResolved: !enabled || registerVisit.isSuccess || registerVisit.isError,
		shouldShow,
		submit,
		dismiss,
	}
}
