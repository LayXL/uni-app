import type { Room } from "@repo/shared/building-scheme"

import { ModalRoot } from "@/shared/ui/modal-root"

import { RoomSchedule } from "./room-schedule"

type RoomScheduleModalProps = {
	room: Room | null
	isOpen: boolean
	onClose: () => void
}

export const RoomScheduleModal = ({
	room,
	isOpen,
	onClose,
}: RoomScheduleModalProps) => (
	<ModalRoot isOpen={isOpen} onClose={onClose}>
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1 pr-10">
				<h2 className="text-xl font-medium">Расписание кабинета</h2>
				<p className="text-sm text-muted">{room?.name}</p>
			</div>
			<RoomSchedule key={room?.id} room={room} />
		</div>
	</ModalRoot>
)
