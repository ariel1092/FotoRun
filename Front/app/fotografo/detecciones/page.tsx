"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Eye, ImageIcon, TrendingUp, Filter } from "lucide-react"
import Link from "next/link"
import { photosApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DetectionsPage() {
  const [photos, setPhotos] = useState<any[]>([])
  const [filteredDetections, setFilteredDetections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchPhotos()
  }, [])

  useEffect(() => {
    filterDetections()
  }, [searchQuery, statusFilter, photos])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
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

  const filterDetections = () => {
    let allDetections: any[] = []

    // Collect all detections from all photos
    photos.forEach((photo) => {
      if (photo.detections && photo.detections.length > 0) {
        photo.detections.forEach((detection: any) => {
          allDetections.push({
            ...detection,
            photoId: photo.id,
            photoUrl: photo.thumbnailUrl || photo.url,
            photoName: photo.originalName,
            photoStatus: photo.processingStatus,
            raceId: photo.raceId,
            raceName: photo.race?.name,
          })
        })
      }
    })

    // Filter by search query
    if (searchQuery) {
      allDetections = allDetections.filter(
        (d) =>
          d.bibNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.photoName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by photo status
    if (statusFilter !== "all") {
      allDetections = allDetections.filter((d) => d.photoStatus === statusFilter)
    }

    setFilteredDetections(allDetections)
  }

  const stats = {
    total: filteredDetections.length,
    uniqueBibs: new Set(filteredDetections.map((d) => d.bibNumber)).size,
    avgConfidence:
      filteredDetections.length > 0
        ? filteredDetections.reduce((sum, d) => sum + (d.confidence || 0), 0) /
          filteredDetections.length
        : 0,
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Detecciones de Dorsales</h1>
        <p className="text-muted-foreground">Revisá y gestioná todas las detecciones de dorsales</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Detecciones</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <ImageIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dorsales Únicos</p>
              <p className="text-2xl font-bold">{stats.uniqueBibs}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confianza Promedio</p>
              <p className="text-2xl font-bold">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de dorsal o nombre de foto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Detections Table */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      ) : filteredDetections.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No se encontraron detecciones</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Intenta con otros filtros"
              : "Sube fotos y procesalás para ver las detecciones aquí"}
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Dorsal</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetections.map((detection, index) => (
                <TableRow key={`${detection.photoId}-${detection.id || index}`}>
                  <TableCell className="font-medium">{detection.bibNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(detection.confidence * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={detection.photoUrl}
                        alt={detection.photoName}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {detection.photoName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {detection.raceName ? (
                      <Link
                        href={`/fotografo/eventos/${detection.raceId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {detection.raceName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {detection.detectionMethod || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/fotografo/fotos/${detection.photoId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

