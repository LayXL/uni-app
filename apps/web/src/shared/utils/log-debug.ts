const isDebug = process.env.DEBUG === "true"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const logDebug = (...args: any) => {
  if (!isDebug) return

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(args)
}
