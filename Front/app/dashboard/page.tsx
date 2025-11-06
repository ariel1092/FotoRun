"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ImageIcon, ShoppingBag, User } from "lucide-react"
import { useState } from "react"

// Mock purchased photos data
const mockPurchasedPhotos = [
  {
    id: "1",
    url: "/runner-with-bib-number-1234-crossing-finish-line.jpg",
    highResUrl: "/runner-with-bib-number-1234-crossing-finish-line.jpg",
    bibNumber: "1234",
    eventName: "Maratón de Buenos Aires 2024",
    purchaseDate: "2024-09-20T14:30:00",
    price: 500,
  },
  {
    id: "2",
    url: "/runner-with-bib-1234-running-on-street.jpg",
    highResUrl: "/runner-with-bib-1234-running-on-street.jpg",
    bibNumber: "1234",
    eventName: "Maratón de Buenos Aires 2024",
    purchaseDate: "2024-09-20T14:30:00",
    price: 500,
  },
]

// Mock orders data
const mockOrders = [
  {
    id: "order-1",
    date: "2024-09-20T14:30:00",
    total: 1000,
    status: "completed",
    photoCount: 2,
    eventName: "Maratón de Buenos Aires 2024",
  },
]

export default function DashboardPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (photoId: string, url: string) => {
    setDownloadingId(photoId)
    try {
      // Simulate download
      const link = document.createElement("a")
      link.href = url
      link.download = `photo-${photoId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading photo:", error)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-12">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Mi Panel</h1>
              <p className="text-muted-foreground">Administrá tus fotos y compras</p>
            </div>

            <Tabs defaultValue="photos" className="space-y-6">
              <TabsList>
                <TabsTrigger value="photos" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Mis Fotos
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Mis Compras
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Fotos Compradas</h2>
                      <p className="text-sm text-muted-foreground">
                        Descargá tus fotos en alta resolución sin marca de agua
                      </p>
                    </div>
                    <Badge variant="secondary">{mockPurchasedPhotos.length} fotos</Badge>
                  </div>

                  {mockPurchasedPhotos.length === 0 ? (
                    <div className="py-12 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">Todavía no compraste ninguna foto</p>
                      <Button className="mt-4" asChild>
                        <a href="/buscar">Buscar fotos</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {mockPurchasedPhotos.map((photo) => (
                        <Card key={photo.id} className="overflow-hidden">
                          <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                            <img
                              src={photo.url || "/placeholder.svg"}
                              alt={`Foto ${photo.bibNumber}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">{photo.eventName}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  Dorsal {photo.bibNumber}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(photo.purchaseDate).toLocaleDateString("es-AR")}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleDownload(photo.id, photo.highResUrl)}
                              disabled={downloadingId === photo.id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingId === photo.id ? "Descargando..." : "Descargar HD"}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Historial de Compras</h2>
                    <p className="text-sm text-muted-foreground">Todas tus transacciones</p>
                  </div>

                  {mockOrders.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">No tenés compras registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <Card key={order.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">Orden #{order.id}</p>
                                <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                                  {order.status === "completed" ? "Completada" : "Pendiente"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{order.eventName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.date).toLocaleString("es-AR")} · {order.photoCount} fotos
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-foreground">${order.total}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Información Personal</h2>
                    <p className="text-sm text-muted-foreground">Administrá tu cuenta</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Nombre</label>
                        <p className="text-sm text-muted-foreground">Juan Pérez</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <p className="text-sm text-muted-foreground">juan.perez@example.com</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Teléfono</label>
                        <p className="text-sm text-muted-foreground">+54 9 11 1234-5678</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Miembro desde</label>
                        <p className="text-sm text-muted-foreground">Septiembre 2024</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button>Editar Perfil</Button>
                      <Button variant="outline">Cambiar Contraseña</Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
