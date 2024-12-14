import { useIsomorphicLayoutEffect } from "@/shared/hooks/use-isomorphic-layout-effect"
import { Cron } from "croner"
import { useEffect, useRef } from "react"

export const useCron = (pattern: string | Date, callback: () => void) => {
  const savedCallback = useRef(callback)

  useIsomorphicLayoutEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const job = new Cron(pattern, () => {
      savedCallback.current()
    })

    return () => job.stop()
  }, [pattern])
}
