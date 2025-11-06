"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Camera, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Settings,
  ImageIcon
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api-client"

// Mock data - reemplazar con datos reales del backend
const mockStats = {
  totalUsers: 1250,
  totalPhotographers: 8,
  totalEvents: 15,
  totalPhotos: 12500,
  totalSales: 450000,
  thisMonthSales: 125000,
}

const mockUsers = [
  {
    id: "1",
    email: "user1@example.com",
    name: "Juan Pérez",
    role: "user",
    isActive: true,
    createdAt: "2024-09-15T10:00:00",
  },
  {
    id: "2",
    email: "photographer@example.com",
    name: "Fotógrafo JERPRO",
    role: "photographer",
    isActive: true,
    createdAt: "2024-08-20T10:00:00",
  },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación y rol
    const token = localStorage.getItem("jerpro_token")
    if (!token) {
      router.push("/login")
      return
    }

    // TODO: Verificar rol desde el token o hacer request al backend
    // Por ahora, asumimos que si llegamos aquí, es admin
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-12">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestioná usuarios, fotógrafos y eventos del sistema</p>
              </div>
              <Badge variant="default" className="gap-2">
                <Shield className="h-4 w-4" />
                Administrador
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Usuarios</p>
                    <p className="text-2xl font-bold text-foreground">{mockStats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fotógrafos</p>
                    <p className="text-2xl font-bold text-foreground">{mockStats.totalPhotographers}</p>
                  </div>
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Eventos Activos</p>
                    <p className="text-2xl font-bold text-foreground">{mockStats.totalEvents}</p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ventas Totales</p>
                    <p className="text-2xl font-bold text-foreground">${mockStats.totalSales.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
              <TabsList>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger value="photographers" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Fotógrafos
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Eventos
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Gestión de Usuarios</h2>
                      <p className="text-sm text-muted-foreground">
                        Administrá usuarios del sistema y sus roles
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mockUsers.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{user.name}</p>
                              <Badge 
                                variant={
                                  user.role === 'admin' ? 'default' : 
                                  user.role === 'photographer' ? 'secondary' : 
                                  'outline'
                                }
                              >
                                {user.role === 'admin' ? 'Admin' : 
                                 user.role === 'photographer' ? 'Fotógrafo' : 
                                 'Usuario'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Registrado: {new Date(user.createdAt).toLocaleDateString("es-AR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // TODO: Implementar cambio de rol
                                console.log("Cambiar rol de usuario:", user.id)
                              }}
                            >
                              Cambiar Rol
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                // TODO: Implementar eliminación
                                console.log("Eliminar usuario:", user.id)
                              }}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="photographers" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Fotógrafos</h2>
                    <p className="text-sm text-muted-foreground">
                      Gestioná los fotógrafos registrados en el sistema
                    </p>
                  </div>
                  <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Eventos</h2>
                    <p className="text-sm text-muted-foreground">
                      Administrá todos los eventos del sistema
                    </p>
                  </div>
                  <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Configuración del Sistema</h2>
                    <p className="text-sm text-muted-foreground">
                      Ajustes generales de la plataforma
                    </p>
                  </div>
                  <p className="text-muted-foreground">Funcionalidad en desarrollo...</p>
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


