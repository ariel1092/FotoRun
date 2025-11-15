"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ImageIcon, Plus, Upload, ArrowRight, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { racesApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = events.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredEvents(filtered)
    } else {
      setFilteredEvents(events)
    }
  }, [searchQuery, events])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await racesApi.getAll()
      setEvents(data)
      setFilteredEvents(data)
    } catch (error: any) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      return { label: "Finalizado", variant: "secondary" as const }
    } else if (eventDate.getTime() === today.getTime()) {
      return { label: "Hoy", variant: "default" as const }
    } else {
      return { label: "Próximo", variant: "default" as const }
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setDeletingEventId(eventId)
      await racesApi.delete(eventId, false) // Soft delete por defecto
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido desactivado exitosamente",
      })
      // Recargar eventos
      await fetchEvents()
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el evento",
        variant: "destructive",
      })
    } finally {
      setDeletingEventId(null)
    }
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Eventos</h1>
          <p className="text-muted-foreground">Administrá tus eventos deportivos</p>
        </div>
        <Button asChild>
          <Link href="/fotografo/eventos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos por nombre o ubicación..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Events List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-32 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {searchQuery ? "No se encontraron eventos" : "No hay eventos aún"}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {searchQuery
              ? "Intenta con otros términos de búsqueda"
              : "Crea tu primer evento para comenzar"}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link href="/fotografo/eventos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Evento
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event.date)
            const eventDate = new Date(event.date)

            return (
              <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{event.name}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{eventDate.toLocaleDateString("es-AR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.distance && (
                      <div className="flex items-center gap-2">
                        <span>📏</span>
                        <span>{event.distance}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/fotografo/eventos/${event.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/fotografo/eventos/${event.id}/subir`}>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Fotos
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingEventId === event.id}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas desactivar el evento "{event.name}"?
                            Esta acción desactivará el evento pero no eliminará las fotos asociadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEvent(event.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

