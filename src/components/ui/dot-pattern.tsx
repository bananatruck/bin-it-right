// Source: Magic UI, https://magicui.design/r/dot-pattern.json
import React, { useEffect, useId, useRef, useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number | undefined
  height?: number | undefined
  x?: number | undefined
  y?: number | undefined
  cx?: number | undefined
  cy?: number | undefined
  cr?: number | undefined
  className?: string | undefined
  glow?: boolean | undefined
}

function Dot({
  cx,
  cy,
  r,
  glow,
  gradientId,
}: {
  cx: number
  cy: number
  r: number
  glow: boolean
  gradientId: string
}) {
  const [timing] = useState(() => ({
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }))

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={glow ? `url(#${gradientId})` : "currentColor"}
      initial={glow ? { opacity: 0.4, scale: 1 } : {}}
      animate={
        glow
          ? {
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.5, 1],
            }
          : {}
      }
      transition={
        glow
          ? {
              duration: timing.duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay: timing.delay,
              ease: "easeInOut",
            }
          : {}
      }
    />
  )
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  const cols = width > 0 ? Math.ceil(dimensions.width / width) : 0
  const rows = height > 0 ? Math.ceil(dimensions.height / height) : 0

  const dots = Array.from({ length: cols * rows }, (_, i) => {
    const col = cols > 0 ? i % cols : 0
    const row = cols > 0 ? Math.floor(i / cols) : 0
    return {
      x: col * width + cx + x,
      y: row * height + cy + y,
    }
  })

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <Dot
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          glow={glow}
          gradientId={`${id}-gradient`}
        />
      ))}
    </svg>
  )
}
