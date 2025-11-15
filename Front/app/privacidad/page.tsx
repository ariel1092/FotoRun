"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"

export default function PrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
            
            <div className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
                <p className="text-muted-foreground">
                  Recopilamos información que nos proporcionas directamente cuando te registras, 
                  subes fotos, realizas compras o te comunicas con nosotros. Esta información 
                  incluye nombre, email, información de pago y fotos que subes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
                <p className="text-muted-foreground">
                  Utilizamos la información recopilada para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Procesar tus pedidos y gestionar tu cuenta</li>
                  <li>Mejorar nuestros servicios y experiencia del usuario</li>
                  <li>Comunicarnos contigo sobre tu cuenta y nuestros servicios</li>
                  <li>Detectar y prevenir fraudes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Compartir Información</h2>
                <p className="text-muted-foreground">
                  No vendemos, alquilamos ni compartimos tu información personal con terceros, 
                  excepto cuando sea necesario para proporcionar nuestros servicios, cumplir 
                  con la ley o proteger nuestros derechos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Seguridad</h2>
                <p className="text-muted-foreground">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger 
                  tu información personal contra acceso no autorizado, alteración, divulgación 
                  o destrucción.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Tus Derechos</h2>
                <p className="text-muted-foreground">
                  Tienes derecho a acceder, corregir, eliminar o portar tu información personal. 
                  También puedes oponerte al procesamiento de tu información o solicitar la 
                  limitación de su uso.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Contacto</h2>
                <p className="text-muted-foreground">
                  Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en: 
                  <a href="mailto:info@jerpro.com.ar" className="text-primary hover:underline ml-1">
                    info@jerpro.com.ar
                  </a>
                </p>
              </section>

              <section>
                <p className="text-sm text-muted-foreground mt-8">
                  Última actualización: {new Date().toLocaleDateString('es-AR')}
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


