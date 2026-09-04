export const PARSING_TIMEZONE = "Asia/Yekaterinburg"
export const PARSING_CRON = "0 5-18 * * *"

const localTime = new Intl.DateTimeFormat("en-GB", {
	timeZone: PARSING_TIMEZONE,
	hourCycle: "h23",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
})

export const getParsingTimeRemaining = (now = new Date()) => {
	const [hour, minute, second] = localTime.format(now).split(":").map(Number)
	if (hour < 5 || hour >= 19) return 0

	return (
		((19 - hour) * 3600 - minute * 60 - second) * 1000 - now.getMilliseconds()
	)
}
