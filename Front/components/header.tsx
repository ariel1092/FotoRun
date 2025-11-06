"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CartButton } from "@/components/cart-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Camera, User } from "lucide-react"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Obtener usuario del localStorage
    const userStr = localStorage.getItem("jerpro_user")
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error("Error parsing user:", e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("jerpro_token")
    localStorage.removeItem("jerpro_user")
    setUser(null)
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return null
    if (user.role === "admin") return "/admin/dashboard"
    if (user.role === "photographer") return "/fotografo/dashboard"
    return "/dashboard"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/jerpro-logo.png" alt="JERPRO" className="h-8" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#como-funciona"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Cómo funciona
          </Link>
          <Link
            href="/buscar"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Buscar fotos
          </Link>
          {user && getDashboardLink() && (
            <Link
              href={getDashboardLink()!}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {user.role === "admin" && <Shield className="h-4 w-4" />}
              {user.role === "photographer" && <Camera className="h-4 w-4" />}
              {user.role === "user" && <User className="h-4 w-4" />}
              Panel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
          <CartButton />
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/registro">Registrarse</Link>
          </Button>
            </>
          ) : (
            <>
              <CartButton />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.name}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
