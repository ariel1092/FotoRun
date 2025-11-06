import { Search, ImageIcon, Download } from "lucide-react"
import { Card } from "@/components/ui/card"

const steps = [
  {
    icon: Search,
    title: "Ingresá tu número",
    description: "Buscá por tu número de dorsal y encontrá todas tus fotos del evento.",
    step: "1",
  },
  {
    icon: ImageIcon,
    title: "Elegí tus fotos",
    description: "Navegá por tu galería personal y seleccioná las fotos que más te gusten.",
    step: "2",
  },
  {
    icon: Download,
    title: "Descargá en HD",
    description: "Comprá y descargá tus fotos en alta resolución sin marca de agua.",
    step: "3",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-muted/20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-4 uppercase">
            ¿Cómo funciona?
          </h2>
          <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
            Tres simples pasos para tener tus fotos deportivas
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card
                key={index}
                className="relative overflow-hidden p-8 bg-card border-t-4 border-t-secondary border-x-0 border-b-0 hover:shadow-xl hover:shadow-primary/5 transition-all"
              >
                <div className="absolute right-4 top-4 text-7xl font-bold text-primary/20">{step.step}</div>
                <div className="relative space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
