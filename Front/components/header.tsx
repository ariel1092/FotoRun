"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CartButton } from "@/components/cart-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Camera, User, Menu, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()

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
    setMobileMenuOpen(false)
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return null
    if (user.role === "admin") return "/admin/dashboard"
    if (user.role === "photographer") return "/fotografo/dashboard"
    return "/dashboard"
  }

  const navLinks = [
    { href: "/como-funciona", label: "Cómo funciona" },
    { href: "/buscar", label: "Buscar fotos" },
    { href: "/faq", label: "FAQ" },
  ]

  const NavLink = ({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) => (
    <Link
      href={href}
      onClick={onClick}
      className="text-base font-medium text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-accent/50 min-h-[44px] flex items-center"
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center">
          <span className="text-xl font-bold text-primary">JERPRO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              {link.label}
            </Link>
          ))}
          {user && getDashboardLink() && (
            <Link
              href={getDashboardLink()!}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 min-h-[44px]"
            >
              {user.role === "admin" && <Shield className="h-4 w-4" />}
              {user.role === "photographer" && <Camera className="h-4 w-4" />}
              {user.role === "user" && <User className="h-4 w-4" />}
              Panel
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <CartButton />
              <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                <Link href="/login">Ingresar</Link>
              </Button>
              <Button size="sm" asChild className="min-h-[44px]">
                <Link href="/registro">Registrarse</Link>
              </Button>
            </>
          ) : (
            <>
              <CartButton />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.name}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="min-h-[44px]">
                  Salir
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <CartButton />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menú</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
                {user && getDashboardLink() && (
                  <Link
                    href={getDashboardLink()!}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-accent/50 min-h-[44px] flex items-center gap-2"
                  >
                    {user.role === "admin" && <Shield className="h-5 w-5" />}
                    {user.role === "photographer" && <Camera className="h-5 w-5" />}
                    {user.role === "user" && <User className="h-5 w-5" />}
                    Panel
                  </Link>
                )}
              </nav>
              <div className="flex flex-col gap-3 mt-8 pt-8 border-t border-border">
                {!user ? (
                  <>
                    <Button variant="outline" asChild className="w-full min-h-[44px]">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Ingresar
                      </Link>
                    </Button>
                    <Button asChild className="w-full min-h-[44px]">
                      <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                        Registrarse
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Usuario</p>
                      <p className="text-base font-medium text-foreground">{user.name}</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="w-full min-h-[44px]">
                      Salir
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
