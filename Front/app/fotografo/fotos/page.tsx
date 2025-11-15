"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ImageIcon,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Download,
  Eye,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { photosApi } from "@/lib/api-client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPhotos()
    // Poll for status updates
    const interval = setInterval(() => {
      fetchPhotos()
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterPhotos()
  }, [searchQuery, statusFilter, photos])

  const fetchPhotos = async () => {
    try {
      const data = await photosApi.getAll()
      setPhotos(data)
    } catch (error: any) {
      console.error("Error fetching photos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPhotos = () => {
    let filtered = photos

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.processingStatus === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.detections?.some((d: any) =>
            d.bibNumber?.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    setFilteredPhotos(filtered)
  }

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

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setDeletingPhotoId(photoId)
      await photosApi.delete(photoId)
      toast({
        title: "Foto eliminada",
        description: "La foto ha sido eliminada exitosamente",
      })
      // Recargar fotos
      await fetchPhotos()
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

  const stats = {
    total: photos.length,
    completed: photos.filter((p) => p.processingStatus === "completed").length,
    processing: photos.filter((p) => p.processingStatus === "processing").length,
    pending: photos.filter((p) => p.processingStatus === "pending").length,
    failed: photos.filter((p) => p.processingStatus === "failed").length,
  }

  return (
    <div className="container py-6 sm:py-8 space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Fotos</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Gestioná todas tus fotos subidas</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completadas</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Procesando</p>
          <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Fallidas</p>
          <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de archivo o número de dorsal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 sm:h-10 text-base sm:text-sm min-h-[48px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-12 sm:h-10 text-base sm:text-sm min-h-[48px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-square bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-base sm:text-lg font-semibold">No se encontraron fotos</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Intenta con otros filtros"
              : "Sube fotos desde un evento"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-square relative bg-muted">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.originalName}
                  className="w-full h-full object-cover"
                />
                {/* Overlay con botones - siempre visible en móvil, hover en desktop */}
                <div className="absolute inset-0 bg-black/40 sm:bg-black/0 sm:group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <div className="flex gap-2 sm:gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      asChild
                      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                    >
                      <Link href={`/fotografo/fotos/${photo.id}`} aria-label="Ver detalles">
                        <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      asChild
                      className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                    >
                      <a 
                        href={photo.url} 
                        download 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="Descargar foto"
                      >
                        <Download className="h-5 w-5 sm:h-4 sm:w-4" />
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={deletingPhotoId === photo.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                          aria-label="Eliminar foto"
                        >
                          <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
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
                <div className="absolute top-2 right-2 z-10">
                  {getStatusBadge(photo.processingStatus || "pending")}
                </div>
              </div>
              <div className="p-3 sm:p-3 space-y-2">
                <p className="text-xs sm:text-xs text-muted-foreground truncate">
                  {photo.originalName}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {photo.detections?.length || 0} dorsales
                  </span>
                  {photo.race && (
                    <Link
                      href={`/fotografo/eventos/${photo.race.id}`}
                      className="text-primary hover:underline min-h-[44px] flex items-center"
                    >
                      {photo.race.name}
                    </Link>
                  )}
                </div>
                {photo.processingError && (
                  <p className="text-xs text-red-500 truncate" title={photo.processingError}>
                    Error: {photo.processingError}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

