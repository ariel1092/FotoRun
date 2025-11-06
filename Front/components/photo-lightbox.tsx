"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PhotoLightboxProps {
  photoUrl: string
  onClose: () => void
}

export function PhotoLightbox({ photoUrl, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-4 top-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>
      <img
        src={photoUrl || "/placeholder.svg"}
        alt="Vista ampliada"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
