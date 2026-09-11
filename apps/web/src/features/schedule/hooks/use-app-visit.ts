"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"

import { getAppSessionId } from "../lib/get-app-session-id"

export const useAppVisit = ({ enabled = true } = {}) => {
	const user = useUser()
	const [sessionId, setSessionId] = useState<string>()
	useEffect(() => {
		setSessionId(getAppSessionId())
	}, [])
	const query = useQuery({
		queryKey: ["app-visit", user.id, sessionId],
		queryFn: () =>
			orpc.feedback.registerVisit.call({
				sessionId: sessionId ?? getAppSessionId(),
			}),
		enabled: enabled && !!sessionId,
		staleTime: Infinity,
		gcTime: Infinity,
		retry: 1,
	})
	return { ...query, sessionId }
}

export const AppVisitRegistration = () => {
	useAppVisit()
	return null
}
