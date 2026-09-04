"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
	getClientTestTimeOffsetHours,
	setClientTestTimeOffsetHours,
} from "@/shared/utils/test-time"

export const DebugTimeOffsetControl = () => {
	const user = useUser()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [value, setValue] = useState("0")

	useEffect(() => {
		setValue(getClientTestTimeOffsetHours().toString())
	}, [])

	if (!user.isAdmin && !import.meta.env.DEV) return null

	const applyOffset = () => {
		setClientTestTimeOffsetHours(Number(value))
		void queryClient.invalidateQueries()
		void navigate({ to: "/", replace: true })
	}

	const resetOffset = () => {
		setClientTestTimeOffsetHours(0)
		void queryClient.invalidateQueries()
		void navigate({ to: "/", replace: true })
	}

	return (
		<div className="relative bg-card rounded-3xl p-4 flex flex-col gap-3">
			<div>
				<p className="font-medium">Сдвиг времени</p>
				<p className="text-sm text-muted">
					В часах, для проверки расписания и дедлайнов
				</p>
			</div>
			<div className="flex gap-2">
				<Input
					type="number"
					min={-8784}
					max={8784}
					step={1}
					value={value}
					onChange={(event) => setValue(event.target.value)}
					className="min-w-0 flex-1"
				/>
				<Button label="Применить" size="sm" onClick={applyOffset} />
			</div>
			<Button
				label="Сбросить сдвиг"
				size="sm"
				variant="secondary"
				onClick={resetOffset}
			/>
		</div>
	)
}
