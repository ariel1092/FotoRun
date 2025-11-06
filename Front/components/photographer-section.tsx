import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, TrendingUp, Zap, Shield } from "lucide-react"
import Image from "next/image"

const benefits = [
  {
    icon: Camera,
    title: "Subí tus fotos fácilmente",
    description: "Interfaz simple para cargar y organizar fotos de eventos.",
  },
  {
    icon: Zap,
    title: "IA detecta dorsales",
    description: "Tecnología automática para identificar números de corredor.",
  },
  {
    icon: TrendingUp,
    title: "Vendé más",
    description: "Los corredores encuentran sus fotos y compran directamente.",
  },
  {
    icon: Shield,
    title: "Pagos seguros",
    description: "Integración con MercadoPago para transacciones confiables.",
  },
]

export function PhotographerSection() {
  return (
    <section id="fotografos" className="py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                ¿Sos fotógrafo deportivo?
              </h2>
              <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
                Potenciá tu negocio con nuestra plataforma. Subí tus fotos, dejá que la IA haga el trabajo pesado, y
                vendé más.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/fotografo/registro">Registrate como fotógrafo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contacto">Más información</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-primary/20">
              <div className="relative h-48">
                <Image
                  src="/jerpro-banner.png"
                  alt="JERPRO - Fotografía deportiva profesional"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">JERPRO</h3>
                  <p className="text-muted-foreground">Fotografía deportiva profesional</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Costo inicial</span>
                    <span className="text-2xl font-bold text-foreground">$0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Comisión por venta</span>
                    <span className="text-2xl font-bold text-foreground">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Eventos</span>
                    <span className="text-2xl font-bold text-foreground">∞</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sin costos ocultos. Solo pagás cuando vendés. Recibí tus pagos directamente en tu cuenta de
                    MercadoPago.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
