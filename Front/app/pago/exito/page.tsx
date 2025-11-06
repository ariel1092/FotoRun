"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { useCartStore } from "@/lib/cart-store"

export default function PaymentSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart)
  const [purchaseData, setPurchaseData] = useState<any>(null)

  useEffect(() => {
    const pendingPurchase = localStorage.getItem("pendingPurchase")
    if (pendingPurchase) {
      const data = JSON.parse(pendingPurchase)
      setPurchaseData(data)

      // Clear cart after successful payment
      clearCart()

      // TODO: When backend is ready, verify payment status with API
      // and mark purchase as completed
    }
  }, [clearCart])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl space-y-6">
            <Card className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">¡Pago exitoso!</h1>
                <p className="text-muted-foreground">Tu compra se procesó correctamente</p>
              </div>

              {purchaseData && (
                <div className="space-y-4 pt-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Compraste {purchaseData.items.length} foto{purchaseData.items.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">Total: ${purchaseData.total}</p>
                    <p className="text-sm text-muted-foreground">Email: {purchaseData.email}</p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      Te enviamos un email a <strong>{purchaseData.email}</strong> con el link para descargar tus fotos
                      en alta resolución sin marca de agua.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Si no recibís el email en los próximos minutos, revisá tu carpeta de spam o contactanos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link href="/buscar">Buscar más fotos</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/">Volver al inicio</Link>
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
