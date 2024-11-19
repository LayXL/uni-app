"use client"
import { TransformableElement } from "@/features/map-view/ui/transformable-element"

export const MapView = () => {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    // <motion.svg
    //   drag={true}
    //   width="581"
    //   height="401"
    //   viewBox="0 0 581 401"
    //   fill="none"
    //   xmlns="http://www.w3.org/2000/svg"
    // >
    //   <rect width="581" height="401" fill="white" />
    //   <rect x="80" y="103" width="153" height="176" fill="#D9D9D9" />
    // </motion.svg>
    <TransformableElement />
  )
}
