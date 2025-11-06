"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import { racesApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const date = formData.get("date") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string

    try {
      await racesApi.create({
        name,
        date,
        location: location || undefined,
        discipline: description || undefined,
      })

      toast({
        title: "Evento creado",
        description: "El evento se creó exitosamente",
      })

      router.push("/fotografo/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el evento",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8">
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Evento</h1>
              <p className="text-muted-foreground">Completá la información del evento deportivo</p>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Evento *</Label>
                  <Input id="name" placeholder="Ej: Maratón de Buenos Aires 2024" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del Evento *</Label>
                  <Input id="date" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" placeholder="Ej: Buenos Aires, Argentina" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del evento, distancias, categorías, etc."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio por Foto (ARS) *</Label>
                  <Input id="price" type="number" placeholder="500" min="0" step="50" required />
                  <p className="text-xs text-muted-foreground">Precio sugerido: $500 por foto</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Creando..." : "Crear Evento"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
  )
}
