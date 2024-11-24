const isDebug = process.env.NODE_ENV === "development"

export const logDebug = (...args: Parameters<typeof console.info>) => {
  if (!isDebug) return

  console.info(args)
}
