export const shouldShowScheduleSettingsHint = ({
	visitCount,
	dismissed,
	forced,
}: {
	visitCount: number
	dismissed: boolean
	forced: boolean
}) => !dismissed && (forced || visitCount >= 2)
