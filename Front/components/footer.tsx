import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Fotografía deportiva profesional. Capturamos tus mejores momentos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-foreground">Plataforma</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link 
                  href="/buscar" 
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Buscar fotos
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-foreground">Seguinos</h3>
            <div className="flex gap-3">
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] min-w-[44px]"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] min-w-[44px]"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="flex h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] min-w-[44px]"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 border-t border-border pt-6 sm:pt-8">
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} JERPRO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
