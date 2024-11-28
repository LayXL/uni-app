import {
  type MouseEventHandler,
  type TouchEventHandler,
  type TouchList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import map from "./map.png"

const getTouchDistance = (touches: TouchList) => {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  )
}

const getTouchAngle = (touches: TouchList) => {
  return Math.atan2(
    touches[1].clientY - touches[0].clientY,
    touches[1].clientX - touches[0].clientX
  )
}

const GestureMap = () => {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })

  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })
  const touchDistance = useRef(0)
  const touchAngle = useRef(0)
  const touchCenter = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const bounds = svgRef.current?.getBoundingClientRect()

    if (!bounds) return

    const mouseX = e.clientX - bounds.left
    const mouseY = e.clientY - bounds.top

    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(10, prev.scale * scaleFactor)),
      x: prev.x - (mouseX - prev.x) * (scaleFactor - 1),
      y: prev.y - (mouseY - prev.y) * (scaleFactor - 1),
    }))
  }, [])

  const handleMouseDown: MouseEventHandler<SVGSVGElement> = (e) => {
    isDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove: MouseEventHandler<SVGSVGElement> = (e) => {
    if (!isDragging.current) return

    const dx = e.clientX - lastPosition.current.x
    const dy = e.clientY - lastPosition.current.y

    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }))

    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const getTouchCenter = (touches: TouchList) => {
    const bounds = svgRef.current?.getBoundingClientRect()

    return bounds
      ? {
          x: (touches[0].clientX + touches[1].clientX) / 2 - bounds.left,
          y: (touches[0].clientY + touches[1].clientY) / 2 - bounds.top,
        }
      : { x: 0, y: 0 }
  }

  const handleTouchStart: TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length === 2) {
      touchDistance.current = getTouchDistance(e.touches)
      touchAngle.current = getTouchAngle(e.touches)
      touchCenter.current = getTouchCenter(e.touches)
    } else if (e.touches.length === 1) {
      lastPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
  }

  const handleTouchMove: TouchEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault()

    if (e.touches.length === 2) {
      const newDistance = getTouchDistance(e.touches)
      const newAngle = getTouchAngle(e.touches)
      const newCenter = getTouchCenter(e.touches)

      const scaleFactor = newDistance / touchDistance.current
      const rotationDelta = ((newAngle - touchAngle.current) * 180) / Math.PI

      setTransform((prev) => {
        const newScale = Math.max(0.1, Math.min(10, prev.scale * scaleFactor))

        const localOldCenter = {
          x: (touchCenter.current.x - prev.x) / prev.scale,
          y: (touchCenter.current.y - prev.y) / prev.scale,
        }

        const rad = (rotationDelta * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        const dx = newCenter.x - touchCenter.current.x
        const dy = newCenter.y - touchCenter.current.y

        return {
          scale: newScale,
          rotation: prev.rotation + rotationDelta,
          x:
            newCenter.x -
            (localOldCenter.x * cos - localOldCenter.y * sin) * newScale +
            dx,
          y:
            newCenter.y -
            (localOldCenter.x * sin + localOldCenter.y * cos) * newScale +
            dy,
        }
      })

      touchDistance.current = newDistance
      touchAngle.current = newAngle
      touchCenter.current = newCenter
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPosition.current.x
      const dy = e.touches[0].clientY - lastPosition.current.y

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }))

      lastPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
  }

  useEffect(() => {
    svgRef.current?.addEventListener("wheel", handleWheel, { passive: false })
    return () => svgRef.current?.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  return (
    <div className="w-screen h-screen overflow-hidden touch-none">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <title>Map View</title>
        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.scale}) rotate(${transform.rotation})`}
        >
          <image href={map.src} width={840} height={840} />
        </g>
      </svg>
    </div>
  )
}

export default GestureMap
