"use client"

import Countdown from "@/features/countdown/ui/countdown"
import { useCron } from "@/shared/hooks/use-cron"
import type { ClassValue } from "clsx"
import { differenceInSeconds } from "date-fns/differenceInSeconds"
import { useState } from "react"

const diffFromNow = (endsAt: Date) => differenceInSeconds(endsAt, new Date())

type TimerProps = {
  className?: ClassValue
  endsAt: Date
}

export const Timer = (props: TimerProps) => {
  const [seconds, setSeconds] = useState(diffFromNow(props.endsAt))

  useCron("* * * * * *", () => setSeconds(diffFromNow(props.endsAt)))

  return <Countdown seconds={seconds} className={props.className} />
}
