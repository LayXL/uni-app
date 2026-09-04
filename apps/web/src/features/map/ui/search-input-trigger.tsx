import { useState } from "react"

import { Icon } from "@/shared/ui/icon"
import { usePopupClose } from "@/shared/ui/popup"
import { Portal } from "@/shared/ui/portal"
import { SearchInput, type SearchInputItem } from "@/shared/ui/search-input"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

type SearchInputTriggerProps = {
	icon: IconName
	value?: number
	placeholder: string
	items: SearchInputItem<number>[]
	excludeKey?: number | null
	onChange: (id: number) => void
	filterFn?: (item: SearchInputItem<number>, query: string) => boolean
}

export const SearchInputTrigger = ({
	icon,
	value,
	placeholder,
	items,
	excludeKey,
	onChange,
	filterFn,
}: SearchInputTriggerProps) => {
	const [isOpen, setIsOpen] = useState(false)

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
					className="h-12 w-full flex items-center text-left"
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
					<div className="fixed inset-0 bg-background z-50 p-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
						<SearchInput
							autoFocus
							items={filteredItems}
							value={value}
							onChange={handleChange}
							filterFn={filterFn}
							placeholder={placeholder}
							maxSuggestions={8}
							emptyMessage="Место не найдено"
							onBlur={() => setIsOpen(false)}
						/>
					</div>
				</Portal>
			)}
		</>
	)
}
