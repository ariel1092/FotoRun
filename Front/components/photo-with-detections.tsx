"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Detection {
  id: string
  bibNumber: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
  detectionConfidence?: number
  ocrConfidence?: number
  detectionMethod?: string
}

interface PhotoWithDetectionsProps {
  photoUrl: string
  detections: Detection[]
  showAnnotations?: boolean
  onDetectionClick?: (detection: Detection) => void
}

export function PhotoWithDetections({
  photoUrl,
  detections = [],
  showAnnotations = true,
  onDetectionClick,
}: PhotoWithDetectionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [hoveredDetection, setHoveredDetection] = useState<string | null>(null)

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        })
      }
    }

    const image = imageRef.current
    if (image) {
      if (image.complete) {
        updateImageSize()
      } else {
        image.addEventListener("load", updateImageSize)
      }
    }

    window.addEventListener("resize", updateImageSize)

    return () => {
      window.removeEventListener("resize", updateImageSize)
      if (image) {
        image.removeEventListener("load", updateImageSize)
      }
    }
  }, [photoUrl])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "rgb(34, 197, 94)" // green-500
    if (confidence >= 0.6) return "rgb(234, 179, 8)" // yellow-500
    return "rgb(239, 68, 68)" // red-500
  }

  const getMethodColor = (method?: string) => {
    switch (method) {
      case "roboflow_only":
        return "rgb(59, 130, 246)" // blue-500
      case "ocr_verified":
        return "rgb(34, 197, 194)" // teal-500
      case "ocr_corrected":
        return "rgb(168, 85, 247)" // purple-500
      default:
        return "rgb(156, 163, 175)" // gray-400
    }
  }

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case "roboflow_only":
        return "Roboflow"
      case "ocr_verified":
        return "OCR Verificado"
      case "ocr_corrected":
        return "OCR Corregido"
      default:
        return "Detectado"
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <img
        ref={imageRef}
        src={photoUrl}
        alt="Foto con detecciones"
        className="w-full h-auto object-contain"
      />

      {showAnnotations && imageSize.width > 0 && detections.length > 0 && (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            width: imageSize.width,
            height: imageSize.height,
          }}
        >
          {detections.map((detection) => {
            const isHovered = hoveredDetection === detection.id
            const color = getConfidenceColor(detection.confidence)

            return (
              <g key={detection.id}>
                {/* Bounding Box */}
                <rect
                  x={detection.x}
                  y={detection.y}
                  width={detection.width}
                  height={detection.height}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 4 : 2}
                  strokeDasharray={isHovered ? "0" : "5,5"}
                  className="transition-all duration-200"
                  style={{
                    pointerEvents: "auto",
                    cursor: onDetectionClick ? "pointer" : "default",
                  }}
                  onMouseEnter={() => setHoveredDetection(detection.id)}
                  onMouseLeave={() => setHoveredDetection(null)}
                  onClick={() => onDetectionClick?.(detection)}
                />

                {/* Label Background */}
                <rect
                  x={detection.x}
                  y={detection.y - 28}
                  width={Math.max(detection.bibNumber.length * 12 + 20, 60)}
                  height={26}
                  fill={color}
                  opacity={isHovered ? 1 : 0.9}
                  rx={4}
                  className="transition-opacity duration-200"
                />

                {/* Bib Number Label */}
                <text
                  x={detection.x + 10}
                  y={detection.y - 10}
                  fill="white"
                  fontSize="16"
                  fontWeight="bold"
                  className="select-none"
                >
                  #{detection.bibNumber}
                </text>

                {/* Confidence Badge (shown on hover) */}
                {isHovered && (
                  <>
                    <rect
                      x={detection.x}
                      y={detection.y + detection.height + 4}
                      width={120}
                      height={24}
                      fill="rgba(0, 0, 0, 0.8)"
                      rx={4}
                    />
                    <text
                      x={detection.x + 8}
                      y={detection.y + detection.height + 20}
                      fill="white"
                      fontSize="12"
                      fontWeight="500"
                    >
                      {(detection.confidence * 100).toFixed(1)}% confianza
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      )}

      {/* Legend */}
      {showAnnotations && detections.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2">
          <div className="font-semibold mb-2">Detecciones: {detections.length}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(34, 197, 94)" }} />
              <span>Alta (≥80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(234, 179, 8)" }} />
              <span>Media (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(239, 68, 68)" }} />
              <span>Baja (&lt;60%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Detection Method Legend */}
      {showAnnotations && detections.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set(detections.map((d) => d.detectionMethod))).map((method) => {
            const count = detections.filter((d) => d.detectionMethod === method).length
            return (
              <Badge
                key={method}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: getMethodColor(method),
                  color: getMethodColor(method),
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: getMethodColor(method) }}
                />
                {getMethodLabel(method)}: {count}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
