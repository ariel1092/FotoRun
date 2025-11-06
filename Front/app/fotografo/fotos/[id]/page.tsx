"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Download,
  ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { photosApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function PhotoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const photoId = params.id as string
  const [photo, setPhoto] = useState<any>(null)
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPhoto()
    fetchStatus()

    // Poll for status if processing
    if (status?.status === "processing" || status?.status === "pending") {
      setPolling(true)
      const interval = setInterval(() => {
        fetchStatus()
      }, 5000) // Every 5 seconds

      return () => {
        clearInterval(interval)
        setPolling(false)
      }
    }
  }, [photoId, status?.status])

  const fetchPhoto = async () => {
    try {
      setLoading(true)
      const data = await photosApi.getById(photoId)
      setPhoto(data)
    } catch (error: any) {
      console.error("Error fetching photo:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la foto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    try {
      const data = await photosApi.getById(photoId)
      const statusData = await photosApi.getById(photoId)
      // Assuming we have a status endpoint
      setStatus({
        status: data.processingStatus || "pending",
        isProcessed: data.isProcessed,
        processedAt: data.processedAt,
        error: data.processingError,
      })
      setPhoto(data)
    } catch (error) {
      console.error("Error fetching status:", error)
    }
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

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="container py-8">
        <Card className="p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">Foto no encontrada</h3>
          <Button asChild className="mt-4">
            <Link href="/fotografo/fotos">Volver a Fotos</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fotografo/fotos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{photo.originalName}</h1>
          <p className="text-muted-foreground">Detalles y detecciones de la foto</p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(photo.processingStatus || "pending")}
          <Button variant="outline" size="sm" asChild>
            <a href={photo.url} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo Preview */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-auto bg-muted">
              <img
                src={photo.url}
                alt={photo.originalName}
                className="w-full h-auto object-contain"
              />
            </div>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Información</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{photo.originalName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tamaño</p>
                <p className="font-medium">
                  {photo.size ? `${(photo.size / 1024 / 1024).toFixed(2)} MB` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(photo.processingStatus || "pending")}</div>
              </div>
              {photo.processedAt && (
                <div>
                  <p className="text-muted-foreground">Procesada</p>
                  <p className="font-medium">
                    {new Date(photo.processedAt).toLocaleString("es-AR")}
                  </p>
                </div>
              )}
              {photo.race && (
                <div>
                  <p className="text-muted-foreground">Evento</p>
                  <Link
                    href={`/fotografo/eventos/${photo.race.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {photo.race.name}
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {photo.processingError && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="font-semibold mb-2 text-red-900">Error de Procesamiento</h3>
              <p className="text-sm text-red-700">{photo.processingError}</p>
            </Card>
          )}

          {polling && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <p className="text-sm">Verificando estado...</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Detections */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Detecciones de Dorsales</h2>
            <p className="text-sm text-muted-foreground">
              {photo.detections?.length || 0} dorsales detectados
            </p>
          </div>
        </div>

        {photo.detections && photo.detections.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Dorsal</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Confianza Detección</TableHead>
                <TableHead>Confianza OCR</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {photo.detections.map((detection: any) => (
                <TableRow key={detection.id}>
                  <TableCell className="font-medium">{detection.bibNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(detection.confidence * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{detection.detectionMethod || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    {detection.detectionConfidence
                      ? `${(detection.detectionConfidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {detection.ocrConfidence
                      ? `${(detection.ocrConfidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {photo.processingStatus === "processing" ? (
              <div className="space-y-2">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
                <p>Procesando foto... Los dorsales aparecerán aquí cuando termine.</p>
              </div>
            ) : photo.processingStatus === "failed" ? (
              <div className="space-y-2">
                <XCircle className="mx-auto h-8 w-8 text-red-500" />
                <p>Error al procesar la foto. No se detectaron dorsales.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Clock className="mx-auto h-8 w-8" />
                <p>La foto está pendiente de procesamiento.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

