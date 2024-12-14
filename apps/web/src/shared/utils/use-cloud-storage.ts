import { useMutation, useQuery } from "@tanstack/react-query"
import superjson from "superjson"

export const useCloudStorage = <T>(key: string, defaultValue?: T) =>
  [
    useQuery({
      queryKey: ["cloud-storage", key],
      queryFn: async () => {
        const value = localStorage.getItem(key)

        if (value) return superjson.parse(value) as T

        return defaultValue
      },
    }),
    useMutation({
      mutationKey: ["cloud-storage", key],
      mutationFn: async (value: T) => {
        localStorage.setItem(key, superjson.stringify(value))

        return value
      },
    }),
  ] as const
