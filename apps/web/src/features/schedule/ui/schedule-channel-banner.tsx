"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"

import { useUser } from "@/entities/user/hooks/useUser"
import { useCloudStorage } from "@/shared/hooks/use-cloud-storage"
import { analytics } from "@/shared/lib/analytics"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

const ELIGIBLE_GROUP_CODES = new Set(["БИ", "ДГ", "ДИ", "ДЦ", "П", "ПИ", "ДВ"])
const HIDDEN_AT_STORAGE_KEY = "secretsCodeBannerHiddenAt"
const CHANNEL_URL = "https://t.me/secretscode"
const CHANNEL_IMAGE_URL = "/images/secretscode-channel-v2.webp"

const getGroupCode = (displayName: string) =>
	displayName
		.trim()
		.match(/^[A-Za-zА-Яа-яЁё]+/)?.[0]
		?.toUpperCase()

export const ScheduleChannelBannerCard = ({
	onDismiss,
	onClick,
	imageUrl = CHANNEL_IMAGE_URL,
}: {
	onDismiss?: () => void
	onClick?: () => void
	imageUrl?: string
}) => (
	<section
		className="relative px-6 py-2 text-center"
		aria-label="Рекомендация Telegram-канала"
	>
		<div>
			<Touchable>
				<a
					href={CHANNEL_URL}
					target="_blank"
					rel="noopener noreferrer"
					onClick={onClick}
					className="relative block"
				>
					<div className="relative mx-auto mb-3 size-24">
						<span
							aria-hidden="true"
							className="absolute inset-0 rounded-full bg-[#2c2c2e] ring-1 ring-border/70"
						/>
						{imageUrl && (
							<div
								className="absolute -inset-x-1 -top-2 bottom-0 z-10"
								style={{
									clipPath:
										'path("M 0 0 H 104 V 56 H 100 A 48 48 0 0 1 52 104 A 48 48 0 0 1 4 56 H 0 Z")',
								}}
							>
								<img
									src={imageUrl}
									alt="Автор Telegram-канала"
									draggable={false}
									className="size-[104px] object-contain"
								/>
							</div>
						)}
					</div>
					<h3 className="mx-auto max-w-72 text-[19px] leading-[1.15] font-semibold text-balance">
						Айти меняется быстрее учебной программы
					</h3>
					<p className="mx-auto mt-2 max-w-76 text-sm leading-5 text-muted">
						Узнавай новое про ИИ, веб — всё, что помогает быть на шаг впереди
					</p>
					<span className="relative mt-4 inline-flex overflow-hidden rounded-full bg-[#27a7e7] p-[1.5px]">
						<span
							aria-hidden="true"
							className="absolute -inset-[150%] animate-channel-border bg-[conic-gradient(from_90deg,transparent_0deg,transparent_230deg,rgba(255,255,255,0.4)_270deg,#fff_300deg,rgba(255,255,255,0.4)_330deg,transparent_360deg)] motion-reduce:animate-none"
						/>
						<span className="relative inline-flex items-center justify-center gap-1.5 rounded-full bg-[#27a7e7] px-3 py-2 text-sm font-semibold text-white">
							Читать канал
							<Icon name="iconify:material-symbols:arrow-outward" size={16} />
						</span>
					</span>
				</a>
			</Touchable>
			{onDismiss && (
				<Touchable>
					<button
						type="button"
						onClick={onDismiss}
						aria-label="Больше не показывать баннер"
						className="absolute right-3 top-1 grid size-8 place-items-center text-muted"
					>
						<Icon name="iconify:material-symbols:close-rounded" size={18} />
					</button>
				</Touchable>
			)}
		</div>
	</section>
)

export const AnimatedScheduleChannelBanner = ({
	isVisible,
	onDismiss,
	onClick,
}: {
	isVisible: boolean
	onDismiss: () => void
	onClick?: () => void
}) => {
	const shouldReduceMotion = useReducedMotion()

	return (
		<AnimatePresence initial={false}>
			{isVisible && (
				<motion.div
					key="schedule-channel-banner"
					initial={{ opacity: 0, height: 0, marginBottom: -24 }}
					animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
					exit={{ opacity: 0, height: 0, marginBottom: -24 }}
					transition={{
						duration: shouldReduceMotion ? 0 : 0.28,
						ease: [0.4, 0, 0.2, 1],
					}}
					className="overflow-hidden"
				>
					<ScheduleChannelBannerCard onDismiss={onDismiss} onClick={onClick} />
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export const ScheduleChannelBanner = () => {
	const user = useUser()
	const trackedGroupNames = useRef(new Set<string>())
	const [hiddenAt, setHiddenAt] = useCloudStorage<number | null>(
		HIDDEN_AT_STORAGE_KEY,
		null,
	)
	const groupName = user.group?.displayName
	const groupCode = groupName ? getGroupCode(groupName) : undefined

	const isVisible = Boolean(
		groupCode && ELIGIBLE_GROUP_CODES.has(groupCode) && hiddenAt === null,
	)

	useEffect(() => {
		if (!isVisible || !groupName || trackedGroupNames.current.has(groupName)) {
			return
		}

		trackedGroupNames.current.add(groupName)
		analytics.track("channel_banner_shown", {
			channel: "secretscode",
			group_name: groupName,
		})
	}, [groupName, isVisible])

	return (
		<AnimatedScheduleChannelBanner
			isVisible={isVisible}
			onDismiss={() => {
				if (!groupName) return
				const hiddenAt = Date.now()
				analytics.track("channel_banner_dismissed", {
					channel: "secretscode",
					group_name: groupName,
				})
				setHiddenAt(hiddenAt)
			}}
			onClick={() => {
				if (!groupName) return
				analytics.track("channel_banner_clicked", {
					channel: "secretscode",
					group_name: groupName,
				})
			}}
		/>
	)
}
