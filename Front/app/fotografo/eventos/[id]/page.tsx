"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ImageIcon,
  Upload,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { racesApi, photosApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface EventStats {
  totalPhotos: number
  processedPhotos: number
  pendingPhotos: number
  totalDetections: number
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // Poll for photo status updates
    const interval = setInterval(() => {
      fetchPhotos()
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [eventId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventData, photosData] = await Promise.all([
        racesApi.getById(eventId),
        photosApi.getByRaceId(eventId),
      ])
      setEvent(eventData)
      setPhotos(photosData)
      calculateStats(photosData)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del evento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const photosData = await photosApi.getByRaceId(eventId)
      setPhotos(photosData)
      calculateStats(photosData)
    } catch (error) {
      console.error("Error fetching photos:", error)
    }
  }

  const calculateStats = (photosData: any[]) => {
    const totalPhotos = photosData.length
    const processedPhotos = photosData.filter((p) => p.isProcessed).length
    const pendingPhotos = totalPhotos - processedPhotos
    const totalDetections = photosData.reduce(
      (sum, p) => sum + (p.detections?.length || 0),
      0
    )

    setStats({
      totalPhotos,
      processedPhotos,
      pendingPhotos,
      totalDetections,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completado</Badge>
      case "processing":
        return <Badge className="bg-blue-500">Procesando</Badge>
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="secondary">Pendiente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Evento no encontrado</h3>
          <Button asChild className="mt-4">
            <Link href="/fotografo/eventos">Volver a Eventos</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const eventDate = new Date(event.date)
  const isActive = eventDate >= new Date()

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fotografo/eventos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
          <p className="text-muted-foreground">Detalles y gestión del evento</p>
        </div>
        <Button asChild>
          <Link href={`/fotografo/eventos/${event.id}/subir`}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Fotos
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fotos</p>
                <p className="text-2xl font-bold">{stats.totalPhotos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procesadas</p>
                <p className="text-2xl font-bold">{stats.processedPhotos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendingPhotos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dorsales Detectados</p>
                <p className="text-2xl font-bold">{stats.totalDetections}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Event Info y Photos */}
      <Tabs defaultValue="photos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="photos">
            Fotos ({photos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Activo" : "Finalizado"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {eventDate.toLocaleDateString("es-AR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.distance && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">📏</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Distancia</p>
                      <p className="font-medium">{event.distance}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                  <p className="text-sm">{event.description}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          {photos.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No hay fotos aún</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Sube fotos para comenzar a detectar dorsales
              </p>
              <Button asChild>
                <Link href={`/fotografo/eventos/${event.id}/subir`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Fotos
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Photos Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.originalName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(photo.processingStatus || "pending")}
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {photo.originalName}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {photo.detections?.length || 0} dorsales
                        </span>
                        {photo.processingStatus === "processing" && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            Procesando...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

