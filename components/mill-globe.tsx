"use client"

import createGlobe, { COBEOptions } from "cobe"
import { useEffect, useRef } from "react"

import { ORIGIN } from "@/lib/airports"
import { cn } from "@/lib/utils"

const INDIGO: [number, number, number] = [42 / 255, 75 / 255, 215 / 255]
const THREAD: [number, number, number] = [232 / 255, 84 / 255, 47 / 255]

export interface GlobeLane {
  coords: [number, number]
  weight: number
}

// Decorative markers for the public landing page — no client data.
const DECORATIVE_MARKERS = [
  { location: [19.09, 72.87], size: 0.08 },
  { location: [45.63, 8.72], size: 0.05 },
  { location: [10.82, 106.66], size: 0.05 },
  { location: [25.08, 121.23], size: 0.04 },
  { location: [-12.02, -77.11], size: 0.04 },
  { location: [19.44, -99.07], size: 0.05 },
  { location: [53.35, -2.28], size: 0.04 },
  { location: [-6.13, 106.66], size: 0.05 },
] as COBEOptions["markers"]

// Canvas globe: undyed cotton sphere, indigo markers, thread-orange arcs.
const BASE_CONFIG: Omit<COBEOptions, "width" | "height"> = {
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.24,
  dark: 0,
  diffuse: 1.15,
  mapSamples: 18000,
  mapBrightness: 9,
  baseColor: [0.86, 0.85, 0.8],
  markerColor: INDIGO,
  glowColor: [0.94, 0.93, 0.89],
  arcColor: THREAD,
  arcWidth: 0.35,
  arcHeight: 0.5,
}

export function MillGlobe({ className, lanes }: { className?: string; lanes?: GlobeLane[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const rotationOffset = useRef(0)
  const lanesRef = useRef(lanes)
  lanesRef.current = lanes

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      rotationOffset.current = delta / 200
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const currentLanes = lanesRef.current
    const options: Omit<COBEOptions, "width" | "height"> = { ...BASE_CONFIG }

    if (currentLanes && currentLanes.length > 0) {
      const maxWeight = Math.max(...currentLanes.map((l) => l.weight), 1)
      options.markers = [
        { location: ORIGIN.coords, size: 0.08 },
        ...currentLanes.map((lane) => ({
          location: lane.coords,
          size: 0.028 + 0.05 * (lane.weight / maxWeight),
        })),
      ]
      options.arcs = currentLanes.map((lane) => ({
        from: ORIGIN.coords,
        to: lane.coords,
        color: THREAD,
      }))
    } else {
      options.markers = DECORATIVE_MARKERS
      options.arcs = []
    }

    let width = canvas.offsetWidth
    let phi = 2.3
    let frame = 0

    const onResize = () => {
      width = canvas.offsetWidth
    }
    window.addEventListener("resize", onResize)

    const globe = createGlobe(canvas, {
      ...options,
      width: width * 2,
      height: width * 2,
      phi,
    })

    const render = () => {
      if (pointerInteracting.current === null) phi += 0.0028
      globe.update({
        phi: phi + rotationOffset.current,
        width: width * 2,
        height: width * 2,
      })
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    const reveal = setTimeout(() => {
      canvas.style.opacity = "1"
    })

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(reveal)
      window.removeEventListener("resize", onResize)
      globe.destroy()
    }
  }, [])

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[560px]", className)}>
      <canvas
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) => updatePointerInteraction(e.clientX - pointerInteractionMovement.current)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  )
}
