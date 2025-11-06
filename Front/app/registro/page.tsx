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

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string

    // Validaciones básicas
    if (!name || name.length < 2 || name.length > 100) {
      toast({
        title: "Error de validación",
        description: "El nombre debe tener entre 2 y 100 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!email || !email.includes("@")) {
      toast({
        title: "Error de validación",
        description: "Ingresá un email válido",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!password || password.length < 6 || password.length > 50) {
      toast({
        title: "Error de validación",
        description: "La contraseña debe tener entre 6 y 50 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.register(email, password, name)
      
      // Guardar token
      localStorage.setItem("jerpro_token", response.access_token)
      localStorage.setItem("jerpro_user", JSON.stringify(response.user))

      // Redirigir según el rol
      const role = response.user.role
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else if (role === "photographer") {
        router.push("/fotografo/dashboard")
      } else {
      router.push("/dashboard")
      }

      toast({
        title: "¡Cuenta creada!",
        description: `Bienvenido ${response.user.name}`,
      })
    } catch (error: any) {
      let errorMessage = "Ocurrió un error al crear tu cuenta"
      
      if (error.data?.message) {
        // Si es un array de mensajes, mostrar el primero
        if (Array.isArray(error.data.message)) {
          errorMessage = error.data.message[0]
        } else {
          errorMessage = error.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error al crear cuenta",
        description: errorMessage,
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Camera className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Crear Cuenta</h1>
              <p className="text-sm text-muted-foreground">Registrate para empezar a buscar tus fotos</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" name="name" type="text" placeholder="Juan Pérez" required minLength={2} maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} maxLength={50} />
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres, máximo 50</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-none cursor-pointer">
                  Acepto los{" "}
                  <Link href="/terminos" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
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
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Ingresá
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
