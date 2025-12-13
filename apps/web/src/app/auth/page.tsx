"use client"

import cookie from "js-cookie"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { isTelegram } from "@/shared/utils/is-telegram"
import { isVK } from "@/shared/utils/is-vk"

export default function Page() {
	const router = useRouter()

	useEffect(() => {
		if (isVK) {
			//
		}
		if (isTelegram) {
			const hash = window.location.hash.slice(1).split("&")[0].split("=")[1]

			if (hash.length > 0) {
				cookie.set("session", `tma ${hash}`, { expires: 7 })
				router.push("/")
			}
		}
	}, [router])

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-2xl font-bold">Please wait...</div>
		</div>
	)
}
