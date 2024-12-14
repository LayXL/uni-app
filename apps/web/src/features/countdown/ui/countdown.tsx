"use client"

import withDefaultProps from "@/shared/hocs/with-default-props"
import cn from "@/shared/utils/cn"
import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import type { ClassValue } from "clsx"

const PrimaryNumberFlow = withDefaultProps(NumberFlow, {
  trend: -1,
  format: { minimumIntegerDigits: 2 },
})

const SecondaryNumberFlow = withDefaultProps(PrimaryNumberFlow, {
  prefix: ":",
  digits: { 1: { max: 5 } },
})

type CountdownProps = {
  className?: ClassValue
  seconds: number
}

export default function Countdown(props: CountdownProps) {
  const hours = Math.floor(props.seconds / 3600)
  const minutes = Math.floor((props.seconds % 3600) / 60)
  const seconds = props.seconds % 60

  return (
    <NumberFlowGroup>
      <div
        style={{ "--number-flow-char-height": "0.85em" }}
        className={cn("flex items-baseline tabular-nums", props.className)}
      >
        <PrimaryNumberFlow value={hours} />
        <SecondaryNumberFlow value={minutes} />
        <SecondaryNumberFlow value={seconds} />
      </div>
    </NumberFlowGroup>
  )
}
