"use client"

import { useEffect } from "react"

import { isTelegram } from "@/shared/utils/is-telegram"
import { isVK } from "@/shared/utils/is-vk"

export default function Page() {
	useEffect(() => {
		if (isVK) {
			//
		}
		if (isTelegram) {
			const hash = window.location.hash.slice(1)

			if (hash.length > 0) {
				//
			}
		}
	}, [])

	return <div>Please wait...</div>
}
