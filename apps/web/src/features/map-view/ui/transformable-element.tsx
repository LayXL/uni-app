import { useGesture } from "@use-gesture/react"
import { motion } from "framer-motion"
import { useRef, useState } from "react"

const ROTATION_SNAP_THRESHOLD = 5

export const TransformableElement = () => {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
  })

  const elementRef = useRef<HTMLDivElement>(null)

  const ROTATION_SNAP_THRESHOLD = 5 // Degrees within which to snap rotation to 0

  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y] }) =>
        setTransform((prev) => ({
          ...prev,
          x,
          y,
        })),
      onPinch: ({
        offset: [scale, rotate],
        origin,
        movement: [, , mx, my],
      }) => {
        const element = elementRef.current
        if (!element) return

        // Get element bounding box
        const rect = element.getBoundingClientRect()

        // Calculate the origin relative to the element
        const originX = origin[0] - rect.left
        const originY = origin[1] - rect.top

        // Adjust the position to maintain the "zoom focus"
        const deltaX = (mx / scale) * (scale - 1)
        const deltaY = (my / scale) * (scale - 1)

        const snappedRotate =
          Math.abs(rotate) < ROTATION_SNAP_THRESHOLD ? 0 : rotate

        setTransform((prev) => ({
          x: prev.x - deltaX,
          y: prev.y - deltaY,
          scale,
          rotate: snappedRotate,
        }))
      },
      onWheel: ({ delta: [, dy] }) => {
        setTransform((prev) => ({
          ...prev,
          scale: Math.max(0.5, Math.min(3, prev.scale - dy * 0.01)),
        }))
      },
    },
    {
      drag: { from: () => [transform.x, transform.y] },
      pinch: {
        scaleBounds: { min: 0.5, max: 3 },
        from: () => [transform.scale, transform.rotate],
      },
    }
  )

  return (
    <div
      {...bind()}
      className="flex h-screen w-screen bg-neutral-1 overflow-hidden touch-none"
    >
      <motion.div
        className="origin-center"
        style={{ ...transform }}
        ref={elementRef}
      >
        {/*<div className="bg-accent-9 rounded-2xl size-64" />*/}
      </motion.div>
    </div>
  )
}
