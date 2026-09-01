"use client"

import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react"

import {
	normalizeUserFeedbackReasons,
	USER_FEEDBACK_REASONS,
	type UserFeedbackReason,
} from "@repo/shared/user-feedback"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

export type UserFeedbackPayload = {
	rating: number
	reasons: UserFeedbackReason[]
	comment: string
}

type UserFeedbackCardProps = {
	onSubmit: (payload: UserFeedbackPayload) => Promise<void> | void
	onClose: () => void
	initialRating?: number
	initialReasons?: UserFeedbackReason[]
	initialComment?: string
}

const ratings = [1, 2, 3, 4, 5] as const
const COMMENT_SAVE_DELAY = 500

export const UserFeedbackCard = ({
	onSubmit,
	onClose,
	initialRating = 0,
	initialReasons = [],
	initialComment = "",
}: UserFeedbackCardProps) => {
	const commentId = useId()
	const [rating, setRating] = useState(initialRating)
	const [reasons, setReasons] = useState<UserFeedbackReason[]>(initialReasons)
	const [comment, setComment] = useState(initialComment)
	const ratingRef = useRef(initialRating)
	const reasonsRef = useRef(initialReasons)
	const commentRef = useRef(initialComment)
	const commentSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const pendingPayloadRef = useRef<UserFeedbackPayload | null>(null)
	const isSavingRef = useRef(false)

	const shouldAskForReasons = rating > 0 && rating <= 3

	const save = useCallback(
		async (payload: UserFeedbackPayload) => {
			pendingPayloadRef.current = payload
			if (isSavingRef.current) return

			isSavingRef.current = true

			while (pendingPayloadRef.current) {
				const nextPayload = pendingPayloadRef.current
				pendingPayloadRef.current = null

				try {
					await onSubmit(nextPayload)
				} catch {
					pendingPayloadRef.current = null
					break
				}
			}

			isSavingRef.current = false
		},
		[onSubmit],
	)

	const saveCurrentFeedback = useCallback(() => {
		if (ratingRef.current === 0) return

		void save({
			rating: ratingRef.current,
			reasons: reasonsRef.current,
			comment: commentRef.current,
		})
	}, [save])

	const cancelScheduledCommentSave = () => {
		if (!commentSaveTimerRef.current) return

		clearTimeout(commentSaveTimerRef.current)
		commentSaveTimerRef.current = null
	}

	useEffect(
		() => () => {
			if (commentSaveTimerRef.current) {
				clearTimeout(commentSaveTimerRef.current)
			}
		},
		[],
	)

	const selectRating = (nextRating: number) => {
		const nextReasons = normalizeUserFeedbackReasons(
			nextRating,
			reasonsRef.current,
		)

		setRating(nextRating)
		setReasons(nextReasons)
		ratingRef.current = nextRating
		reasonsRef.current = nextReasons
		cancelScheduledCommentSave()
		void save({
			rating: nextRating,
			reasons: nextReasons,
			comment: commentRef.current,
		})
	}

	const toggleReason = (reason: UserFeedbackReason) => {
		const currentReasons = reasonsRef.current
		const nextReasons = currentReasons.includes(reason)
			? currentReasons.filter((item) => item !== reason)
			: [...currentReasons, reason]

		setReasons(nextReasons)
		reasonsRef.current = nextReasons
		cancelScheduledCommentSave()
		void save({ rating, reasons: nextReasons, comment: commentRef.current })
	}

	const changeComment = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const nextComment = event.target.value
		setComment(nextComment)
		commentRef.current = nextComment
		cancelScheduledCommentSave()
		commentSaveTimerRef.current = setTimeout(() => {
			commentSaveTimerRef.current = null
			saveCurrentFeedback()
		}, COMMENT_SAVE_DELAY)
	}

	const flushComment = () => {
		if (!commentSaveTimerRef.current) return

		cancelScheduledCommentSave()
		saveCurrentFeedback()
	}

	return (
		<section
			className="relative mx-2 rounded-3xl bg-card p-3 text-center ring-2 ring-transparent"
			aria-labelledby="user-feedback-title"
		>
			<LiquidBorder />
			<Touchable>
				<button
					type="button"
					aria-label="Закрыть форму обратной связи"
					onClick={onClose}
					className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full text-muted outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
				>
					<Icon name="cancel-20" />
				</button>
			</Touchable>
			<h3 id="user-feedback-title" className="px-8 text-lg font-semibold">
				Как тебе приложение?
			</h3>

			<div
				className="mt-1 flex justify-center gap-1"
				role="radiogroup"
				aria-label="Оценка приложения"
			>
				{ratings.map((value) => (
					<Touchable key={value} hapticType="selection">
						<button
							type="button"
							role="radio"
							aria-checked={rating === value}
							aria-label={`${value} ${value === 1 ? "звезда" : value < 5 ? "звезды" : "звёзд"}`}
							onClick={() => selectRating(value)}
							className={cn(
								"grid size-12 place-items-center rounded-2xl text-border outline-none transition-[color,transform] focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none",
								value <= rating && "text-accent",
							)}
						>
							<Icon name="star-alt-16" size={34} />
						</button>
					</Touchable>
				))}
			</div>

			<div className="t-acc text-left" data-open={shouldAskForReasons}>
				<div
					className="t-acc-panel"
					inert={!shouldAskForReasons}
					aria-hidden={!shouldAskForReasons}
				>
					<div className="t-acc-panel-inner">
						<p className="mb-2 pt-3 text-sm font-medium text-muted">
							Что стоит исправить?
						</p>
						<div className="flex flex-wrap gap-1">
							{USER_FEEDBACK_REASONS.map((reason) => {
								const isSelected = reasons.includes(reason.id)

								return (
									<Touchable key={reason.id} hapticType="selection">
										<button
											type="button"
											aria-pressed={isSelected}
											onClick={() => toggleReason(reason.id)}
											className={cn(
												"relative rounded-full bg-secondary px-3 py-2 text-[13px] leading-5 outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent motion-reduce:transition-none",
												isSelected && "bg-accent text-accent-foreground",
											)}
										>
											<LiquidBorder />
											{reason.label}
										</button>
									</Touchable>
								)
							})}
						</div>
					</div>
				</div>
			</div>

			<div className="t-acc text-left" data-open={rating > 0}>
				<div
					className="t-acc-panel"
					inert={rating === 0}
					aria-hidden={rating === 0}
				>
					<div className="t-acc-panel-inner">
						<label
							htmlFor={commentId}
							className="mb-2 block pt-3 text-sm font-medium text-muted"
						>
							Дополнительный комментарий
						</label>
						<div className="relative rounded-2xl bg-secondary transition-shadow focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent motion-reduce:transition-none">
							<LiquidBorder />
							<textarea
								id={commentId}
								value={comment}
								onChange={changeComment}
								onBlur={flushComment}
								maxLength={1000}
								rows={3}
								placeholder="Напиши своими словами"
								className="relative block w-full resize-none rounded-2xl bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
