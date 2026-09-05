"use client"

import { useSyncExternalStore } from "react"

import { scheduleSplashStore } from "../lib/schedule-splash-store"

export const useScheduleSplash = () =>
	useSyncExternalStore(
		scheduleSplashStore.subscribe,
		scheduleSplashStore.getSnapshot,
		scheduleSplashStore.getServerSnapshot,
	)
