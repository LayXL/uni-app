"use client"

import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

export const MapView = () => {
  return (
    <TransformWrapper>
      <TransformComponent>
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
        <svg
          width="581"
          height="401"
          viewBox="0 0 581 401"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="581" height="401" fill="black" />
          <rect x="80" y="103" width="153" height="176" fill="#D9D9D9" />
        </svg>
      </TransformComponent>
    </TransformWrapper>
  )
}
