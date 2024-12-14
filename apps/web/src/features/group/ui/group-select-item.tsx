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
        "px-3 py-2 bg-neutral-3 rounded-lg transition-colors text-left",
        "hover:bg-neutral-4"
      )}
      onMouseDown={props.onClick}
      children={props.name}
    />
  )
}
