"use client"

import dynamic from "next/dynamic"
import type { FC } from "react"

export const withClientSide = (fc: FC) =>
  dynamic(() => Promise.resolve(fc), { ssr: false })
