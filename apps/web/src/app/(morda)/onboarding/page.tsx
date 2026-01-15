import { GroupSelector } from "./_ui/group-selector"

export default async function () {
	return (
		<div className="p-4 flex flex-col gap-2 pt-(--safe-area-inset-top) min-h-lvh max-h-lvh h-lvh">
			<GroupSelector />
		</div>
	)
}
