export function removeScriptElements(input: string): string {
  return input.replace(/<script[\s\S]*?<\/script>/gi, "")
}
