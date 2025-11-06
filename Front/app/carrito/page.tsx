"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCartStore } from "@/lib/cart-store"
import { Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice())
  const [isProcessing, setIsProcessing] = useState(false)
  const [email, setEmail] = useState("")

  const handleCheckout = async () => {
    if (!email || !email.includes("@")) {
      alert("Por favor ingresá un email válido para recibir tus fotos")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, email }),
      })

      const data = await response.json()

      if (data.paymentLink) {
        localStorage.setItem(
          "pendingPurchase",
          JSON.stringify({
            purchaseId: data.purchaseId,
            email: email,
            items: items,
            total: getTotalPrice,
          }),
        )

        window.location.href = data.paymentLink
      } else {
        alert("Error al procesar el pago. Por favor intentá nuevamente.")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      alert("Error al procesar el pago. Por favor intentá nuevamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12">
            <div className="mx-auto max-w-2xl text-center space-y-6">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
              <h1 className="text-3xl font-bold text-foreground">Tu carrito está vacío</h1>
              <p className="text-muted-foreground">Agregá fotos a tu carrito para continuar con la compra</p>
              <Button asChild size="lg">
                <Link href="/buscar">Buscar fotos</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">Tu carrito</h1>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Vaciar carrito
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={item.photoUrl || "/placeholder.svg"}
                          alt="Foto"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.eventName}</p>
                          <Badge variant="secondary">Dorsal {item.bibNumber}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-foreground">${item.price}</p>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="p-6 space-y-6 sticky top-20">
                  <h2 className="text-xl font-semibold text-foreground">Resumen</h2>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email">Email para recibir tus fotos</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Te enviaremos el link de descarga a este email</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({items.length} fotos)</span>
                      <span className="font-medium text-foreground">${getTotalPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="font-medium text-foreground">$0</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">${getTotalPrice}</span>
                  </div>
                  <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isProcessing}>
                    {isProcessing ? "Procesando..." : "Ir a pagar"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Serás redirigido a MercadoPago para completar el pago de forma segura
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
