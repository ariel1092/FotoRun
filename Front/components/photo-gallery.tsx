"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, ZoomIn, AlertCircle, Search } from "lucide-react"
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
        .then((data: any) => {
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
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Buscá tus fotos</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ingresá tu número de dorsal en el formulario de arriba para encontrar todas tus fotos del evento
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="text-muted-foreground">Buscando tus fotos...</p>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex-1">
          <p className="text-sm sm:text-base text-muted-foreground">
            Se encontraron <span className="font-semibold text-foreground">{photos.length}</span> fotos
          </p>
          {totalSelected > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalSelected} seleccionadas · ${totalPrice}
            </p>
          )}
        </div>
        {totalSelected > 0 && (
          <Button 
            onClick={handleAddToCart} 
            className="w-full sm:w-auto min-h-[44px]"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar al carrito ({totalSelected})
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <Card key={photo.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-3/2 overflow-hidden bg-muted">
              <img
                src={buildCloudinaryWatermarkedUrl(
                  photo.url,
                  'JERPRO FOTOGRAFIA'
                )}
                alt={`Foto ${photo.originalName}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105 touch-none"
                loading="lazy"
              />
              <div className="absolute right-2 top-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
                  onClick={() => setLightboxPhoto(
                    buildCloudinaryWatermarkedUrl(
                      photo.url,
                      'JERPRO FOTOGRAFIA'
                    )
                  )}
                  aria-label="Ampliar foto"
                >
                  <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Evento JERPRO</p>
                  <p className="text-xs text-muted-foreground">{new Date(photo.createdAt).toLocaleString("es-AR")}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">Dorsal {bibNumber}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-h-[44px]">
                  <Checkbox
                    id={`photo-${photo.id}`}
                    checked={selectedPhotos.has(photo.id)}
                    onCheckedChange={() => togglePhotoSelection(photo.id)}
                    className="min-h-[20px] min-w-[20px]"
                  />
                  <label 
                    htmlFor={`photo-${photo.id}`} 
                    className="text-sm sm:text-base font-medium text-foreground cursor-pointer min-h-[44px] flex items-center"
                  >
                    $500
                  </label>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => togglePhotoSelection(photo.id)}
                  className="min-h-[44px] px-3 sm:px-4"
                >
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
