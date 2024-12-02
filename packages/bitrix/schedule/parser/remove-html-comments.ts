export function removeHtmlComments(input: string): string {
  return input.replace(/<!--[\s\S]*?-->/g, "")
}
