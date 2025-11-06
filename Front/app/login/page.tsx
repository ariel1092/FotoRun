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
import { authApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await authApi.login(email, password)
      
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
        title: "¡Bienvenido!",
        description: `Hola ${response.user.name}`,
      })
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales inválidas",
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
                <img src="/jerpro-logo.png" alt="JERPRO" className="h-12" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Bienvenido</h1>
              <p className="text-sm text-muted-foreground">Ingresá a tu cuenta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/recuperar-password" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Ingresar"}
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
                <span className="text-muted-foreground">¿No tenés cuenta? </span>
                <Link href="/registro" className="font-medium text-primary hover:underline">
                  Registrate
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
