import cn from "@/shared/utils/cn"

type GroupSelectItemProps = {
  name: string
  onClick: () => void
}

export const GroupSelectItem = (props: GroupSelectItemProps) => {
  return (
    <button
      type="button"
      className={cn(
        "px-2 py-1 bg-neutral-3 border border-neutral-6 rounded-lg transition-colors text-left",
        "hover:bg-neutral-4 hover:border-neutral-7"
      )}
      onClick={props.onClick}
      children={props.name}
    />
  )
}
