"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/cart-store"
import Link from "next/link"

export function CartButton() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <Button variant="outline" size="sm" asChild className="relative bg-transparent min-h-[44px] min-w-[44px]">
      <Link href="/carrito" aria-label={`Carrito de compras${totalItems > 0 ? ` con ${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}` : ''}`}>
        <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" />
        {totalItems > 0 && (
          <Badge className="absolute -right-2 -top-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-xs font-semibold">
            {totalItems}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
