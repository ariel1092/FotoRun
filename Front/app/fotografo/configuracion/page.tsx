"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Camera, Save, User, Mail, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Obtener usuario del localStorage
    const userStr = localStorage.getItem("jerpro_user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (e) {
        console.error("Error parsing user:", e)
      }
    }
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    // TODO: Implementar actualización de perfil
    setTimeout(() => {
      toast({
        title: "Configuración actualizada",
        description: "Tus cambios se guardaron correctamente",
      })
      setSaving(false)
    }, 1000)
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

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administrá tu perfil y preferencias</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Perfil</h2>
                <p className="text-sm text-muted-foreground">Información personal</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  defaultValue={user?.name || ""}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  El email no se puede cambiar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business">Nombre del Negocio (opcional)</Label>
                <Input
                  id="business"
                  placeholder="Ej: Fotografía Deportiva JP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Settings */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Contraseña</h2>
                <p className="text-sm text-muted-foreground">Cambiá tu contraseña</p>
              </div>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <Separator />

              <Button type="submit" variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Cambiar Contraseña
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Cuenta</h3>
                <p className="text-xs text-muted-foreground">Fotógrafo</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{user?.name || "N/A"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <h3 className="mb-2 font-semibold text-foreground">Ayuda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Necesitás ayuda? Contactá con soporte técnico.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Contactar Soporte
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

