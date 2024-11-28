import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

interface Transform {
  x: number
  y: number
  scale: number
  rotation: number
}

interface Point {
  x: number
  y: number
}

interface GestureMapProps {
  children: React.ReactNode
  className?: string
  minScale?: number
  maxScale?: number
}

const GestureMap: React.FC<GestureMapProps> = ({
  children,
  className = "",
  minScale = 0.5,
  maxScale = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })

  // State for tracking gesture information
  const gestureRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    previousTouchDistance: 0,
    previousTouchAngle: 0,
    lastCenter: { x: 0, y: 0 },
  })

  // Get relative position within the container
  const getRelativePosition = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 }

      const rect = containerRef.current.getBoundingClientRect()
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    },
    []
  )

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate angle between two touch points
  const getTouchAngle = (touch1: Touch, touch2: Touch): number => {
    return (
      Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) *
      (180 / Math.PI)
    )
  }

  // Handle the start of a gesture (mouse down or touch start)
  const handleGestureStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return

      gestureRef.current = {
        ...gestureRef.current,
        isDragging: true,
        startX: clientX,
        startY: clientY,
        startTransform: { ...transform },
        previousTouchDistance: 0,
        previousTouchAngle: 0,
        lastCenter: { x: clientX, y: clientY },
      }
    },
    [transform]
  )

  // Handle gesture movement (mouse move or touch move)
  const handleGestureMove = useCallback(
    (
      clientX: number,
      clientY: number,
      scale?: number,
      rotation?: number,
      center?: Point
    ) => {
      if (!gestureRef.current.isDragging || !containerRef.current) return

      const deltaX = clientX - gestureRef.current.startX
      const deltaY = clientY - gestureRef.current.startY

      const newTransform = { ...gestureRef.current.startTransform }

      // Apply translation
      if (!scale && !rotation) {
        newTransform.x += deltaX
        newTransform.y += deltaY
      }

      // Apply scale if provided (relative to center point)
      if (scale !== undefined && center) {
        const prevScale = newTransform.scale
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, prevScale * scale)
        )

        // Adjust position to make zoom relative to center point
        const scaleRatio = newScale / prevScale
        const dx = center.x - gestureRef.current.lastCenter.x
        const dy = center.y - gestureRef.current.lastCenter.y

        newTransform.x += dx * (1 - scaleRatio)
        newTransform.y += dy * (1 - scaleRatio)
        newTransform.scale = newScale

        gestureRef.current.lastCenter = center
      }

      // Apply rotation if provided (relative to center point)
      if (rotation !== undefined && center) {
        const newRotation = newTransform.rotation + rotation

        // Convert rotation to radians
        const rad = (rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        // Rotate around center point
        const dx = center.x - gestureRef.current.lastCenter.x
        const dy = center.y - gestureRef.current.lastCenter.y

        newTransform.x += dx * (1 - cos) + dy * sin
        newTransform.y += dy * (1 - cos) - dx * sin
        newTransform.rotation = newRotation

        gestureRef.current.lastCenter = center
      }

      setTransform(newTransform)
    },
    [maxScale, minScale]
  )

  // Handle the end of a gesture (mouse up or touch end)
  const handleGestureEnd = useCallback(() => {
    gestureRef.current.isDragging = false
  }, [])

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleGestureStart(e.clientX, e.clientY)
    },
    [handleGestureStart]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      handleGestureMove(e.clientX, e.clientY)
    },
    [handleGestureMove]
  )

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
      const center = getRelativePosition(e.clientX, e.clientY)

      handleGestureStart(e.clientX, e.clientY)
      handleGestureMove(e.clientX, e.clientY, scaleFactor, undefined, center)
      handleGestureEnd()
    },
    [
      handleGestureStart,
      handleGestureMove,
      handleGestureEnd,
      getRelativePosition,
    ]
  )

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      handleGestureStart(touch.clientX, touch.clientY)

      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        gestureRef.current.previousTouchDistance = getTouchDistance(
          touch1,
          touch2
        )
        gestureRef.current.previousTouchAngle = getTouchAngle(touch1, touch2)

        // Set initial center for two-finger gestures
        gestureRef.current.lastCenter = getRelativePosition(
          (touch1.clientX + touch2.clientX) / 2,
          (touch1.clientY + touch2.clientY) / 2
        )
      }
    },
    [handleGestureStart, getRelativePosition]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]

      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]

        // Calculate center point of the two touches
        const center = getRelativePosition(
          (touch1.clientX + touch2.clientX) / 2,
          (touch1.clientY + touch2.clientY) / 2
        )

        // Calculate scale change
        const currentDistance = getTouchDistance(touch1, touch2)
        const scale = currentDistance / gestureRef.current.previousTouchDistance
        gestureRef.current.previousTouchDistance = currentDistance

        // Calculate rotation change
        const currentAngle = getTouchAngle(touch1, touch2)
        const rotation = currentAngle - gestureRef.current.previousTouchAngle
        gestureRef.current.previousTouchAngle = currentAngle

        handleGestureMove(center.x, center.y, scale, rotation, center)
      } else {
        handleGestureMove(touch.clientX, touch.clientY)
      }
    },
    [handleGestureMove, getRelativePosition]
  )

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      handleGestureEnd()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      handleGestureEnd()
    }

    // Mouse events
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("wheel", handleWheel)

    // Touch events
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("wheel", handleWheel)

      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [handleGestureEnd, handleMouseMove, handleTouchMove, handleWheel])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden touch-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        cursor: gestureRef.current.isDragging ? "grabbing" : "grab",
      }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) 
                     scale(${transform.scale}) 
                     rotate(${transform.rotation}deg)`,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default GestureMap
