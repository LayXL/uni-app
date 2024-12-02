export function getDifferences(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
) {
  const differences: Record<string, unknown> = {}

  for (const key in obj2) {
    if (obj2[key] !== obj1[key]) {
      differences[key] = obj2[key]
    }
  }

  return differences
}
