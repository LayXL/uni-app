import { animated, useSpring } from "@react-spring/web"
import { useGesture } from "@use-gesture/react"
import type React from "react"
import { useState } from "react"

export const MapGestures: React.FC = () => {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1, rotate: 0 })

  // Spring for smooth animations
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
  }))

  // Gesture handling
  const bind = useGesture(
    {
      onDrag: ({ offset: [dx, dy] }) => {
        api.start({ x: dx, y: dy })
        setView((prev) => ({ ...prev, x: dx, y: dy }))
      },
      onPinch: ({ offset: [dScale, dAngle] }) => {
        api.start({ scale: dScale, rotate: dAngle })
        setView((prev) => ({ ...prev, scale: dScale, rotate: dAngle }))
      },
      onWheel: ({ delta: [_, dy], event }) => {
        event.preventDefault() // Prevent page scrolling
        setView((prev) => {
          const newScale = Math.max(0.5, Math.min(5, prev.scale - dy * 0.001))
          api.start({ scale: newScale })
          return { ...prev, scale: newScale }
        })
      },
    },
    {
      drag: { threshold: 10 },
      pinch: { scaleBounds: { min: 0.5, max: 5 } },
    }
  )

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#ddd",
      }}
    >
      <animated.div
        {...bind()}
        style={{
          width: "300%",
          height: "300%",
          backgroundColor: "black",
          transform: x
            .to((xVal) => `translate(${xVal}px, ${y.get()}px)`)
            .to((t) => `scale(${scale.get()}) rotate(${rotate.get()}deg)`),
        }}
      />
    </div>
  )
}

export default MapGestures
