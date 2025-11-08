import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
          
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fotografía deportiva profesional. Capturamos tus mejores momentos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Plataforma</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/buscar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Buscar fotos
                </Link>
              </li>
              <li>
                <Link
                  href="/#como-funciona"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Seguinos</h3>
            <div className="flex gap-3">
              <Link
                href="https://instagram.com"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} JERPRO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
