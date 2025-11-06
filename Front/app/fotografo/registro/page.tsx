"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera } from "lucide-react"
import { authApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function PhotographerRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validar longitud mínima
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Registrar con endpoint específico para fotógrafos
      const response = await authApi.registerPhotographer(email, password, name)

      // Guardar token y usuario
      localStorage.setItem("jerpro_token", response.access_token)
      localStorage.setItem("jerpro_user", JSON.stringify(response.user))

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta de fotógrafo se creó exitosamente",
      })

      router.push("/fotografo/dashboard")
    } catch (error: any) {
      console.error("Error en registro:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/30 py-12">
        <div className="container max-w-md">
          <Card className="p-8">
            <div className="mb-8 text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <Camera className="h-7 w-7 text-secondary-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Registrate como Fotógrafo</h1>
              <p className="text-sm text-muted-foreground">Empezá a vender tus fotos deportivas</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" type="text" placeholder="Juan Pérez" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business">Nombre del Negocio (opcional)</Label>
                <Input id="business" type="text" placeholder="Fotografía Deportiva JP" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="fotografo@email.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="+54 9 11 1234-5678" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" placeholder="••••••••" required minLength={8} />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" required />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-none cursor-pointer">
                  Acepto los{" "}
                  <Link href="/terminos" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>{" "}
                  y la comisión del 15%
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta de Fotógrafo"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">¿Ya tenés cuenta? </span>
                <Link href="/fotografo/login" className="font-medium text-primary hover:underline">
                  Ingresá
                </Link>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/registro" className="text-sm text-primary hover:underline">
              ¿Sos corredor? Registrate acá
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
