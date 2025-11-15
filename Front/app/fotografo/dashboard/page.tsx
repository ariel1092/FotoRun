"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ImageIcon,
  Plus,
  TrendingUp,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  BarChart3,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { photosApi, racesApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
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

interface Stats {
  totalPhotos: number
  processedPhotos: number
  pendingPhotos: number
  totalDetections: number
  photosByRace: Array<{ raceId: string; raceName: string; count: number }>
}

export default function PhotographerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsData, eventsData] = await Promise.all([
          photosApi.getStats(),
          racesApi.getAll(),
        ])
        setStats(statsData)
        setEvents(eventsData || [])
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])
  const [recentPhotos, setRecentPhotos] = useState<any[]>([])
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentPhotos = async () => {
      try {
        const allPhotos = await photosApi.getAll()
        // Ordenar por fecha de creación y tomar las 6 más recientes
        const sorted = allPhotos
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 6)
        setRecentPhotos(sorted)
      } catch (error) {
        console.error("Error fetching recent photos:", error)
      }
    }
    fetchRecentPhotos()
  }, [])

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setDeletingEventId(eventId)
      await racesApi.delete(eventId, false) // Soft delete por defecto
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido desactivado exitosamente",
      })
      // Recargar eventos
      const data = await racesApi.getAll()
      setEvents(data || [])
      // Recargar stats
      const statsData = await photosApi.getStats()
      setStats(statsData)
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

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setDeletingPhotoId(photoId)
      await photosApi.delete(photoId)
      toast({
        title: "Foto eliminada",
        description: "La foto ha sido eliminada exitosamente",
      })
      // Recargar fotos
      const allPhotos = await photosApi.getAll()
      const sorted = allPhotos
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 6)
      setRecentPhotos(sorted)
      // Recargar stats
      const statsData = await photosApi.getStats()
      setStats(statsData)
    } catch (error: any) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la foto",
        variant: "destructive",
      })
    } finally {
      setDeletingPhotoId(null)
    }
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tus eventos y fotos</p>
        </div>
        <Button asChild>
          <Link href="/fotografo/eventos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eventos</p>
                <p className="text-2xl font-bold text-foreground">{events.length}</p>
                <p className="text-xs text-muted-foreground">
                  {events.filter((e) => new Date(e.date) >= new Date()).length} activos
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <ImageIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fotos Subidas</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalPhotos || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingPhotos || 0} pendientes
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procesadas</p>
                <p className="text-2xl font-bold text-foreground">{stats?.processedPhotos || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalPhotos
                    ? `${Math.round((stats.processedPhotos / stats.totalPhotos) * 100)}% completado`
                    : "0% completado"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dorsales Detectados</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalDetections || 0}</p>
                <p className="text-xs text-muted-foreground">Total encontrados</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Fotos Recientes
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Mis Eventos</h2>
                <p className="text-sm text-muted-foreground">Administrá tus eventos y fotos</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/fotografo/eventos">
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="h-20 bg-muted rounded" />
                    </Card>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No hay eventos aún</p>
                  <Button asChild className="mt-4">
                    <Link href="/fotografo/eventos/nuevo">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primer Evento
                    </Link>
                  </Button>
                </div>
              ) : (
                events
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((event) => {
                    const eventStats = stats?.photosByRace.find((r) => r.raceId === event.id)
                    const isActive = new Date(event.date) >= new Date()

                    return (
                      <Card key={event.id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{event.name}</h3>
                              <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? "Activo" : "Finalizado"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.date).toLocaleDateString("es-AR")}
                              </span>
                              <span className="flex items-center gap-1">
                                <ImageIcon className="h-4 w-4" />
                                {eventStats?.count || 0} fotos
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/fotografo/eventos/${event.id}`}>Ver Detalles</Link>
                            </Button>
                            <Button size="sm" asChild>
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
                  })
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Fotos Recientes</h2>
                <p className="text-sm text-muted-foreground">Últimas fotos subidas</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/fotografo/fotos">
                  Ver Todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {recentPhotos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No hay fotos aún</p>
                <p className="text-sm mt-2">Sube fotos desde un evento para comenzar</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentPhotos.map((photo) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case "completed":
                        return (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Completado
                          </Badge>
                        )
                      case "processing":
                        return (
                          <Badge className="bg-blue-500">
                            <Clock className="mr-1 h-3 w-3" />
                            Procesando
                          </Badge>
                        )
                      case "failed":
                        return (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Fallido
                          </Badge>
                        )
                      default:
                        return (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )
                    }
                  }

                  return (
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
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/fotografo/fotos/${photo.id}`}>
                                Ver Detalles
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingPhotoId === photo.id}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas eliminar esta foto? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Estadísticas Detalladas</h2>
              <p className="text-sm text-muted-foreground">Resumen completo de tus fotos y detecciones</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-16 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <p className="font-medium text-foreground">Fotos Pendientes</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.pendingPhotos}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.processedPhotos} de {stats.totalPhotos} fotos procesadas
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{
                          width: stats.totalPhotos
                            ? `${(stats.pendingPhotos / stats.totalPhotos) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="font-medium text-foreground">Fotos Procesadas</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.processedPhotos}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.totalPhotos
                        ? `${Math.round((stats.processedPhotos / stats.totalPhotos) * 100)}% completado`
                        : "0% completado"}
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: stats.totalPhotos
                            ? `${(stats.processedPhotos / stats.totalPhotos) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <p className="font-medium text-foreground">Dorsales Detectados</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalDetections}</p>
                    <p className="text-sm text-muted-foreground">
                      Total de dorsales encontrados en tus fotos
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                      <p className="font-medium text-foreground">Total de Fotos</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalPhotos}</p>
                    <p className="text-sm text-muted-foreground">
                      Fotos subidas en todos tus eventos
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No hay estadísticas disponibles</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
