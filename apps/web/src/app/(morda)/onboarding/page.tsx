import { GroupSelector } from "./_ui/group-selector"

export default async function () {
	return (
		<div className="p-4 flex flex-col gap-2">
			<p>Выберите группу</p>
			<GroupSelector />
		</div>
	)
}
