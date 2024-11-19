export function toObjectWithCamelCase(
  obj: Record<string, any>
): Record<string, any> {
  if (obj === null || typeof obj !== "object") return obj

  if (Array.isArray(obj)) return obj.map(toObjectWithCamelCase)

  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      )
      acc[camelKey] = toObjectWithCamelCase(value)
      return acc
    },
    {} as Record<string, any>
  )
}
