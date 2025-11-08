"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, ZoomIn, AlertCircle } from "lucide-react"
import { PhotoLightbox } from "@/components/photo-lightbox"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCartStore } from "@/lib/cart-store"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { photosApi } from "@/lib/api-client"
import { buildCloudinaryWatermarkedUrl } from "@/lib/utils"

interface Photo {
  id: string
  url: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  raceId: string
  uploadedBy: string
  createdAt: string
}

export function PhotoGallery() {
  const searchParams = useSearchParams()
  const bibNumber = searchParams.get("numero")
  const raceId = searchParams.get("race")

  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addItems = useCartStore((state) => state.addItems)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (bibNumber) {
      setLoading(true)
      setError(null)

      photosApi
        .searchByBibNumber(bibNumber, raceId && raceId !== "all" ? raceId : undefined)
        .then((data) => {
          setPhotos(Array.isArray(data) ? data : data.photos || [])
        })
        .catch((error) => {
          console.error("Error fetching photos:", error)
          setError(`No se encontraron fotos para el dorsal ${bibNumber}`)
          setPhotos([])
        })
        .finally(() => setLoading(false))
    } else {
      setPhotos([])
      setError(null)
    }
  }, [bibNumber, raceId])

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const handleAddToCart = () => {
    const selectedItems = photos
      .filter((p) => selectedPhotos.has(p.id))
      .map((p) => ({
        id: p.id,
        photoUrl: p.url,
        bibNumber: bibNumber || "",
        eventName: "Evento JERPRO",
        price: 500, // Default price - adjust as needed
      }))

    addItems(selectedItems)
    toast({
      title: "Fotos agregadas al carrito",
      description: `Se agregaron ${selectedItems.length} fotos al carrito`,
    })
    setSelectedPhotos(new Set())
    router.push("/carrito")
  }

  if (!bibNumber) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Ingresá un número de dorsal para buscar tus fotos</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || photos.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || `No se encontraron fotos para el dorsal ${bibNumber}. Probá con otro número.`}
        </AlertDescription>
      </Alert>
    )
  }

  const totalSelected = selectedPhotos.size
  const totalPrice = photos.filter((p) => selectedPhotos.has(p.id)).reduce((sum) => sum + 500, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Se encontraron <span className="font-semibold text-foreground">{photos.length}</span> fotos
          </p>
          {totalSelected > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalSelected} seleccionadas · ${totalPrice}
            </p>
          )}
        </div>
        {totalSelected > 0 && (
          <Button onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar al carrito ({totalSelected})
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <Card key={photo.id} className="group relative overflow-hidden">
            <div className="relative aspect-[3/2] overflow-hidden bg-muted">
              <img
                src={buildCloudinaryWatermarkedUrl(
                  photo.url,
                  'JERPRO FOTOGRAFIA'
                )}
                alt={`Foto ${photo.originalName}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setLightboxPhoto(
                    buildCloudinaryWatermarkedUrl(
                      photo.url,
                      'JERPRO FOTOGRAFIA'
                    )
                  )}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Evento JERPRO</p>
                  <p className="text-xs text-muted-foreground">{new Date(photo.createdAt).toLocaleString("es-AR")}</p>
                </div>
                <Badge variant="secondary">Dorsal {bibNumber}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`photo-${photo.id}`}
                    checked={selectedPhotos.has(photo.id)}
                    onCheckedChange={() => togglePhotoSelection(photo.id)}
                  />
                  <label htmlFor={`photo-${photo.id}`} className="text-sm font-medium text-foreground cursor-pointer">
                    $500
                  </label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => togglePhotoSelection(photo.id)}>
                  {selectedPhotos.has(photo.id) ? "Quitar" : "Seleccionar"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {lightboxPhoto && <PhotoLightbox photoUrl={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />}
    </div>
  )
}
