"use client"

import { useState, useEffect, useRef } from "react"
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
  Scan,
  Image as ImageLucide,
  X,
} from "lucide-react"
import Link from "next/link"
import { photosApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { PhotoWithDetections } from "@/components/photo-with-detections"
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
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null)
  const pollingStartTimeRef = useRef<number | null>(null)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const { toast } = useToast()

  // Timeout máximo: 10 minutos (600,000 ms)
  const MAX_POLLING_TIME = 10 * 60 * 1000

  useEffect(() => {
    fetchPhoto()
  }, [photoId])

  useEffect(() => {
    if (!photo) return

    const currentStatus = photo.processingStatus || "pending"
    const shouldPoll = currentStatus === "processing" || currentStatus === "pending"

    if (!shouldPoll) {
      // Si no necesita polling, detenerlo
      setPolling(false)
      pollingStartTimeRef.current = null
      setPollingStartTime(null)
      return
    }

    // Iniciar polling
    setPolling(true)
    if (!pollingStartTimeRef.current) {
      const startTime = Date.now()
      pollingStartTimeRef.current = startTime
      setPollingStartTime(startTime)
    }

    let intervalId: NodeJS.Timeout | null = null

    const pollStatus = async () => {
      try {
        const data = await photosApi.getById(photoId)
        const newStatus = data.processingStatus || "pending"
        
        // 🔧 MEJORA: Actualizar estado inmediatamente
        setPhoto(data)
        setStatus({
          status: newStatus,
          isProcessed: data.isProcessed,
          processedAt: data.processedAt,
          error: data.processingError,
        })

        // Si cambió a completed o failed, detener polling
        if (newStatus === "completed" || newStatus === "failed") {
          setPolling(false)
          pollingStartTimeRef.current = null
          setPollingStartTime(null)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          
          if (newStatus === "completed") {
            toast({
              title: "Procesamiento completado",
              description: "La foto se procesó exitosamente",
            })
          } else if (newStatus === "failed") {
            toast({
              title: "Error en el procesamiento",
              description: data.processingError || "No se pudo procesar la foto",
              variant: "destructive",
            })
          }
          return
        }

        // Verificar timeout máximo
        const startTime = pollingStartTimeRef.current || Date.now()
        if (Date.now() - startTime > MAX_POLLING_TIME) {
          setPolling(false)
          pollingStartTimeRef.current = null
          setPollingStartTime(null)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          toast({
            title: "Tiempo de espera agotado",
            description: "El procesamiento está tardando más de lo esperado. Por favor, recargá la página o contactá soporte.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching status:", error)
      }
    }

    // Ejecutar inmediatamente la primera vez
    pollStatus()

    // Luego ejecutar cada 3 segundos (más frecuente para mejor UX)
    intervalId = setInterval(pollStatus, 3000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [photoId, photo?.processingStatus])

  const fetchPhoto = async () => {
    try {
      setLoading(true)
      const data = await photosApi.getById(photoId)
      setPhoto(data)
      setStatus({
        status: data.processingStatus || "pending",
        isProcessed: data.isProcessed,
        processedAt: data.processedAt,
        error: data.processingError,
      })
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

  const handleManualRefresh = async () => {
    try {
      const data = await photosApi.getById(photoId)
      setPhoto(data)
      setStatus({
        status: data.processingStatus || "pending",
        isProcessed: data.isProcessed,
        processedAt: data.processedAt,
        error: data.processingError,
      })
      
      if (data.processingStatus === "pending" || data.processingStatus === "processing") {
        if (!pollingStartTimeRef.current) {
          const startTime = Date.now()
          pollingStartTimeRef.current = startTime
          setPollingStartTime(startTime)
        }
        setPolling(true)
      } else {
        setPolling(false)
        pollingStartTimeRef.current = null
        setPollingStartTime(null)
      }
    } catch (error) {
      console.error("Error refreshing status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleCancelProcessing = async () => {
    try {
      await photosApi.cancelProcessing(photoId)
      toast({
        title: "Procesamiento cancelado",
        description: "El procesamiento de la foto ha sido cancelado",
      })
      // Refresh photo data
      await fetchPhoto()
    } catch (error: any) {
      console.error("Error cancelling processing:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar el procesamiento",
        variant: "destructive",
      })
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
          {photo.detections && photo.detections.length > 0 && (
            <Button
              variant={showAnnotations ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Con Detecciones
                </>
              ) : (
                <>
                  <ImageLucide className="mr-2 h-4 w-4" />
                  Foto Original
                </>
              )}
            </Button>
          )}
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
            <div className="relative aspect-auto bg-muted p-4">
              {photo.detections && photo.detections.length > 0 ? (
                <PhotoWithDetections
                  photoUrl={photo.url}
                  detections={photo.detections}
                  showAnnotations={showAnnotations}
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.originalName}
                  className="w-full h-auto object-contain"
                />
              )}
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
            <Card className="p-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p className="text-sm font-medium">Verificando estado...</p>
                </div>
                {pollingStartTime && (
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    <p>Tiempo transcurrido: {Math.floor((Date.now() - pollingStartTime) / 1000)}s</p>
                    {Date.now() - pollingStartTime > MAX_POLLING_TIME / 2 && (
                      <p className="mt-1 text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ El procesamiento está tardando más de lo normal
                      </p>
                    )}
                    {Date.now() - pollingStartTime > MAX_POLLING_TIME * 0.8 && (
                      <p className="mt-1 text-red-600 dark:text-red-400 font-medium">
                        ⚠️ Si el procesamiento no termina pronto, puede haber un problema. Contactá soporte.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Actualizar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelProcessing}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-2" />
                    Cancelar
                  </Button>
                </div>
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

