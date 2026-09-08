import { useEffect, useState } from "react"

import { Icon } from "@/shared/ui/icon"
import { usePopupClose } from "@/shared/ui/popup"
import { Portal } from "@/shared/ui/portal"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

type SearchInputTriggerProps = {
	className?: string
	icon: IconName
	value?: number
	placeholder: string
	items: SearchInputItem<number>[]
	excludeKey?: number | null
	onChange: (id: number) => void
	filterFn?: (item: SearchInputItem<number>, query: string) => boolean
}

export const SearchInputTrigger = ({
	className,
	icon,
	value,
	placeholder,
	items,
	excludeKey,
	onChange,
	filterFn,
}: SearchInputTriggerProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [viewport, setViewport] = useState<{
		top: number
		height: number
	} | null>(null)

	useEffect(() => {
		if (!isOpen) return

		const visualViewport = window.visualViewport
		const updateViewport = () => {
			setViewport({
				top: visualViewport?.offsetTop ?? 0,
				height: visualViewport?.height ?? window.innerHeight,
			})
		}

		updateViewport()
		visualViewport?.addEventListener("resize", updateViewport)
		visualViewport?.addEventListener("scroll", updateViewport)
		window.addEventListener("resize", updateViewport)
		return () => {
			visualViewport?.removeEventListener("resize", updateViewport)
			visualViewport?.removeEventListener("scroll", updateViewport)
			window.removeEventListener("resize", updateViewport)
		}
	}, [isOpen])

	usePopupClose(isOpen, () => setIsOpen(false))

	const displayValue = items.find((item) => item.key === value)?.value

	const filteredItems =
		excludeKey != null ? items.filter((item) => item.key !== excludeKey) : items

	const handleChange = (id: number) => {
		onChange(id)
		setIsOpen(false)
	}

	return (
		<>
			<Touchable>
				<button
					type="button"
					className={cn("h-12 w-full flex items-center text-left", className)}
					onClick={() => setIsOpen(true)}
				>
					<div className="size-12 min-w-12 grid place-items-center pointer-events-none">
						<Icon name={icon} size={24} />
					</div>
					<p
						className={cn(
							"text-muted rounded-3xl line-clamp-1 w-full break-all pr-4",
							displayValue && "text-foreground",
						)}
					>
						{displayValue ?? placeholder}
					</p>
				</button>
			</Touchable>
			{isOpen && (
				<Portal>
					<div
						className="fixed inset-x-0 top-0 h-dvh overflow-hidden bg-background z-50 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+1rem)]"
						style={
							viewport
								? { top: viewport.top, height: viewport.height }
								: undefined
						}
					>
						<SearchInput
							autoFocus
							fillAvailableHeight
							items={filteredItems}
							value={value}
							onChange={handleChange}
							filterFn={filterFn}
							placeholder={placeholder}
							maxSuggestions={30}
							emptyMessage="Место не найдено"
							onBlur={() => setIsOpen(false)}
						/>
					</div>
				</Portal>
			)}
		</>
	)
}
