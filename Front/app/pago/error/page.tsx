import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentErrorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl">
            <Card className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Error en el pago</h1>
                <p className="text-muted-foreground">No se pudo procesar tu pago</p>
              </div>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Por favor, intentá nuevamente o contactá a soporte si el problema persiste
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link href="/carrito">Volver al carrito</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/contacto">Contactar soporte</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
