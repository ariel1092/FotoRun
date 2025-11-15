"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

export default function RecuperarPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    // Simular envío de email de recuperación
    // TODO: Integrar con el backend cuando esté disponible
    setTimeout(() => {
      setEmailSent(true)
      setIsLoading(false)
      toast({
        title: "Email enviado",
        description: "Si el email existe, recibirás instrucciones para recuperar tu contraseña.",
      })
    }, 1000)
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-muted/30 py-12">
          <div className="container max-w-md">
            <Card className="p-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Email Enviado</h1>
                <p className="text-muted-foreground">
                  Si el email existe en nuestro sistema, recibirás un enlace para 
                  recuperar tu contraseña. Revisa tu bandeja de entrada y spam.
                </p>
                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Login
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/30 py-12">
        <div className="container max-w-md">
          <Card className="p-8">
            <div className="mb-8 text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Recuperar Contraseña</h1>
              <p className="text-sm text-muted-foreground">
                Ingresá tu email y te enviaremos un enlace para recuperar tu contraseña
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="tu@email.com" 
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="text-sm text-primary hover:underline flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Login
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

