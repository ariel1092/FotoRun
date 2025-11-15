"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Camera, Users, Award, Heart } from "lucide-react"

export default function SobreNosotrosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Sobre Nosotros</h1>
            
            <div className="prose prose-sm max-w-none space-y-6">
              <p className="text-lg text-muted-foreground">
                Somos un equipo apasionado por la fotografía deportiva, dedicados a capturar 
                los momentos más importantes de tus competencias y hacer que encuentres 
                tus fotos de manera fácil y rápida.
              </p>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Nuestra Misión</h2>
                <p className="text-muted-foreground">
                  Facilitar el acceso a las mejores fotos deportivas mediante tecnología 
                  de vanguardia, permitiendo que atletas y fotógrafos se conecten de manera 
                  eficiente y segura.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Nuestros Valores</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Camera className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold">Calidad</h3>
                      <p className="text-sm text-muted-foreground">
                        Nos comprometemos a ofrecer fotos de alta calidad
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold">Comunidad</h3>
                      <p className="text-sm text-muted-foreground">
                        Construimos una comunidad de atletas y fotógrafos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold">Excelencia</h3>
                      <p className="text-sm text-muted-foreground">
                        Buscamos la excelencia en cada detalle
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold">Pasión</h3>
                      <p className="text-sm text-muted-foreground">
                        Amamos lo que hacemos y se nota en nuestro trabajo
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Tecnología</h2>
                <p className="text-muted-foreground">
                  Utilizamos inteligencia artificial avanzada para detectar automáticamente 
                  los números de dorsal en las fotos, haciendo que encontrar tus imágenes 
                  sea rápido y sencillo. Nuestra plataforma está diseñada para ser intuitiva, 
                  segura y eficiente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contacto</h2>
                <p className="text-muted-foreground">
                  ¿Tienes preguntas o sugerencias? Estamos aquí para ayudarte. 
                  Contáctanos en:{" "}
                  <a href="mailto:info@jerpro.com.ar" className="text-primary hover:underline">
                    info@jerpro.com.ar
                  </a>
                </p>
              </section>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}


