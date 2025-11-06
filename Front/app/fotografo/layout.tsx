"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Calendar,
  Upload,
  ImageIcon,
  BarChart3,
  Settings,
  LogOut,
  Camera,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotographerLayoutProps {
  children: React.ReactNode
}

export default function PhotographerLayout({ children }: PhotographerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("jerpro_token")
    const userStr = localStorage.getItem("jerpro_user")

    if (!token || !userStr) {
      router.push("/fotografo/login")
      return
    }

    try {
      const userData = JSON.parse(userStr)
      if (userData.role !== "photographer" && userData.role !== "admin") {
        router.push("/")
        return
      }
      setUser(userData)
    } catch (e) {
      console.error("Error parsing user:", e)
      router.push("/fotografo/login")
    }
  }, [router])

  // Evitar renderizar si no hay usuario (evita flash)
  if (!user) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem("jerpro_token")
    localStorage.removeItem("jerpro_user")
    router.push("/")
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/fotografo/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Eventos",
      href: "/fotografo/eventos",
      icon: Calendar,
    },
    {
      title: "Fotos",
      href: "/fotografo/fotos",
      icon: ImageIcon,
    },
    {
      title: "Detecciones",
      href: "/fotografo/detecciones",
      icon: BarChart3,
    },
    {
      title: "Configuración",
      href: "/fotografo/configuracion",
      icon: Settings,
    },
  ]


  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo y Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/fotografo/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">JERPRO</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          {/* User Info y Logout */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name || user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">Fotógrafo</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name || user.email}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

