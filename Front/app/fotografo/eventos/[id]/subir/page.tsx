"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, CheckCircle } from "lucide-react"
import { useParams } from "next/navigation"
import { photosApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function UploadPhotosPage() {
  const router = useRouter()
  const params = useParams()
  const raceId = params.id as string
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Seleccioná al menos una foto",
        variant: "destructive",
      })
      return
    }

    if (!raceId) {
      toast({
        title: "Error",
        description: "ID de evento no válido",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Simular progreso durante la subida
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      await photosApi.uploadMultiple(selectedFiles, raceId)

      clearInterval(progressInterval)
      setProgress(100)

      toast({
        title: "Fotos subidas",
        description: `${selectedFiles.length} fotos subidas exitosamente`,
      })

      setTimeout(() => {
        router.push("/fotografo/dashboard")
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron subir las fotos",
        variant: "destructive",
      })
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="container py-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Subir Fotos</h1>
              <p className="text-muted-foreground">
                Subí las fotos del evento. La IA detectará automáticamente los números de dorsal.
              </p>
            </div>

            <Card className="p-8">
              {progress === 100 ? (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">¡Fotos subidas con éxito!</h2>
                    <p className="text-muted-foreground">
                      Las fotos están siendo procesadas. La IA detectará los números de dorsal automáticamente.
                    </p>
                  </div>
                  <Button onClick={() => router.push("/fotografo/dashboard")}>Volver al Panel</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Seleccioná las fotos</h3>
                    <p className="text-sm text-muted-foreground mb-4">Arrastrá y soltá o hacé click para seleccionar</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button asChild>
                        <span>Seleccionar Archivos</span>
                      </Button>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        <span>{selectedFiles.length} archivos seleccionados</span>
                      </div>

                      {uploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subiendo fotos...</span>
                            <span className="font-medium text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                      )}

                      <Button onClick={handleUpload} disabled={uploading} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Subiendo..." : "Subir Fotos"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">Consejos para mejores resultados:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Asegurate que los números de dorsal sean visibles y estén enfocados</li>
                <li>• Subí fotos en alta resolución (mínimo 1920x1080)</li>
                <li>• La IA procesará las fotos y detectará los dorsales automáticamente</li>
                <li>• Podés revisar y corregir las detecciones después del procesamiento</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
