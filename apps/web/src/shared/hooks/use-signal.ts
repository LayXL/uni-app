import { useSyncExternalStore } from "react"

export const useSignal = <T>(signal: {
  (): T
  sub(fn: VoidFunction): VoidFunction
}): T | undefined =>
  useSyncExternalStore(
    (onStoreChange) => signal.sub(onStoreChange),
    signal,
    () => undefined
  )
