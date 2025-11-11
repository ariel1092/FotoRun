"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const disciplines = [
  { id: "running", name: "Running" },
  { id: "ciclismo", name: "Ciclismo" },
  { id: "enduro", name: "Enduro" },
  { id: "mtb", name: "Mountain Bike" },
  { id: "trail", name: "Trail Running" },
  { id: "triatlon", name: "Triatlón" },
]

export function HeroSection() {
  const [discipline, setDiscipline] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to search page directly
    router.push('/buscar')
  }

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Brand banner background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/jerpro-banner.png"
          alt="JERPRO - Encontrá tu foto"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/95 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 flex min-h-[600px] flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <span className="text-primary">JERPRO</span> Fotografía Deportiva
            </h1>
            <p className="text-pretty text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Encontrá tus fotos de Running, Ciclismo, Enduro y más. Seleccioná tu disciplina y buscá por número de
              dorsal.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mx-auto max-w-md space-y-4">
            <div className="space-y-3">
              <Button type="submit" size="lg" className="h-14 w-full">
                <Search className="mr-2 h-5 w-5" />
                Buscar mis fotos
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Hacé clic para buscar tus fotos por número de dorsal
            </p>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-foreground bg-card/50 backdrop-blur px-4 py-2 rounded-full border border-border">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>+50,000 fotos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground bg-card/50 backdrop-blur px-4 py-2 rounded-full border border-border">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span>+200 eventos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground bg-card/50 backdrop-blur px-4 py-2 rounded-full border border-border">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>6 disciplinas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
