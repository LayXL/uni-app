"use client"

import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { GroupSelector } from "@/entities/group/ui/group-selector"
import { analytics } from "@/shared/lib/analytics"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { LottiePlayer } from "@/shared/ui/lottie"
import type { IconName } from "@/types/icon-name"

type OnboardingFeatureCardProps = {
	title: string
	description?: string
	icon: IconName
}

const FeatureCard = ({
	title,
	description,
	icon,
}: OnboardingFeatureCardProps) => (
	<div className="flex gap-2 bg-card relative rounded-3xl p-3">
		<LiquidBorder />
		<div className="grid place-items-center aspect-square shrink-0 rounded-2xl bg-accent text-accent-foreground h-10">
			<Icon name={icon} size={20} />
		</div>
		<div className="flex flex-col gap-0.5">
			<h3 className="font-medium">{title}</h3>
			{description && <p className="text-sm text-muted">{description}</p>}
		</div>
	</div>
)

type StepProps = {
	onNext: () => void
}

const FeaturesOverviewStep = ({ onNext }: StepProps) => {
	return (
		<div className="flex flex-col gap-4 pt-4 pb-32">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer
					src="duck-wave"
					className="w-40 h-40 self-center"
					disableFadeIn
					loop
				/>
				<div className="flex flex-col gap-1">
					<h2 className="text-center text-xl font-bold">Привет!</h2>
					<p className="text-center text-sm text-muted text-balance">
						Я помогу тебе быть в курсе всех событий и не пропустить ни одной
						пары
					</p>
				</div>
			</div>
			<div className="flex-1 flex flex-col gap-2">
				<FeatureCard
					icon="iconify:material-symbols:calendar-today"
					title="Расписание твоих пар"
					description="Забудь про скриншоты в&nbsp;галерее&nbsp;&mdash; актуальное расписание под рукой"
				/>
				<FeatureCard
					icon="iconify:material-symbols:school-outline"
					title="Расписание пар преподавателя"
					description="Узнай, где сейчас пара у&nbsp;преподавателя, чтобы задать вопрос"
				/>
				<FeatureCard
					icon="iconify:material-symbols:map-outline"
					title="Интерактивная карта здания"
					description="Легко находи нужную аудиторию и&nbsp;строй быстрые маршруты"
				/>
				<FeatureCard
					icon="iconify:material-symbols:assignment"
					title="Домашние задания"
					description="Делись заданиями с&nbsp;одногруппниками и&nbsp;сдавай всё вовремя"
				/>
			</div>
			<div className="fixed bottom-0 left-0 right-0 mb-(--safe-area-inset-bottom)">
				<div className="pointer-events-none absolute inset-0 -mt-8 bg-linear-to-t/srgb from-background from-50% to-background/0" />
				<div className="p-3 grid">
					<Button label="Поехали!" onClick={onNext} />
				</div>
			</div>
		</div>
	)
}

const GroupSelectionStep = ({ onNext }: StepProps) => {
	const handleGroupClick = async (groupId: number, groupName: string) => {
		await orpc.users.updateUserGroup.call({ groupId })
		analytics.track("group_selected", {
			group_id: groupId,
			group_name: groupName,
			source: "onboarding",
		})
		analytics.track("onboarding_completed", {
			group_id: groupId,
			group_name: groupName,
		})
		onNext()
	}

	return (
		<div className="flex flex-col gap-4 pt-4">
			<div className="flex flex-col gap-2 items-center">
				<LottiePlayer
					src="duck-with-toy"
					className="w-40 h-40 self-center"
					disableFadeIn
					loop
				/>
				<h2 className="text-center text-xl font-bold">Давай знакомиться!</h2>
				<p className="text-center text-sm text-muted text-balance">
					Выбери группу, чтобы расписание всегда было под рукой
				</p>
			</div>
			<GroupSelector onChange={handleGroupClick} />
		</div>
	)
}
const STEPS = [FeaturesOverviewStep, GroupSelectionStep]
const STEP_NAMES = ["features", "group_selection"] as const

export default function OnboardingPage() {
	const router = useRouter()

	const [step, setStep] = useState(0)

	const Step = STEPS[step]

	useEffect(() => {
		analytics.track("onboarding_started", { step_count: STEPS.length })
	}, [])

	const handleNext = () => {
		analytics.track("onboarding_step_completed", {
			step: STEP_NAMES[step],
			step_number: step + 1,
		})

		if (step === STEPS.length - 1) {
			router.replace("/")
			return
		}

		setStep(step + 1)
	}

	return (
		<AnimatePresence>
			<motion.div
				key={step}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="absolute inset-0 p-4 pt-(--safe-area-inset-top)"
			>
				<Step onNext={handleNext} />
			</motion.div>
		</AnimatePresence>
	)
}
