"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import { isInsensitiveMatch } from "@repo/shared/is-insensitive-match"

import { Button } from "@/shared/ui/button"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { LottiePlayer } from "@/shared/ui/lottie"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"

type StepProps = {
	onNext: () => void
}

const Step1 = ({ onNext }: StepProps) => {
	return (
		<div className="flex flex-col gap-4 pt-4 h-screen">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer src="duck-wave" className="w-40 h-40 self-center" />
				<h2 className="text-center text-xl font-bold">Привет!</h2>
			</div>
			<div className="flex-1">
				<div className="flex flex-col bg-card relative rounded-3xl">
					<LiquidBorder />
					<div className="p-4">
						<h3>Расписание твоих пар</h3>
					</div>
					<div className="p-4">
						<h3>Расписание пар преподавателя</h3>
					</div>
					<div className="p-4">
						<h3>Карта здания</h3>
					</div>
				</div>
			</div>
			<Button label="Круто" onClick={onNext} />
		</div>
	)
}

const Step2 = ({ onNext }: StepProps) => {
	const groups = useQuery(orpc.groups.getAllGroups.queryOptions({}))

	const handleGroupClick = async (groupId: number) => {
		await orpc.users.updateUserGroup.call({ groupId })
		onNext()
	}

	const searchItems = useMemo<SearchInputItem<number>[]>(() => {
		if (!groups.data) return []
		return groups.data.map((group) => ({
			key: group.id,
			value: group.displayName,
		}))
	}, [groups.data])

	return (
		<div className="flex flex-col gap-4 pt-4">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer src="duck-with-toy" className="w-40 h-40 self-center" />
				<h2 className="text-center text-xl font-bold">Давай знакомиться!</h2>
				<p className="text-center text-sm text-muted text-balance">
					Выбери группу, чтобы расписание всегда было под крылом!
				</p>
			</div>
			<SearchInput
				placeholder="Введите название группы"
				items={searchItems}
				filterFn={(item, query) => isInsensitiveMatch(item.value, query)}
				onChange={handleGroupClick}
				autoFocus
				maxSuggestions={searchItems.length}
			/>
		</div>
	)
}
const STEPS = [Step1, Step2]

export const GroupSelector = () => {
	const router = useRouter()

	const [step, setStep] = useState(0)

	const Step = STEPS[step]

	return (
		<Step
			onNext={() => {
				if (step === STEPS.length - 1) {
					router.replace("/")
					return
				}

				setStep(step + 1)
			}}
		/>
	)
}
