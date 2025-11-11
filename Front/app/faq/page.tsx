"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface FAQItem {
  question: string
  answer: string | string[]
}

const faqData: FAQItem[] = [
  {
    question: "¿Cuántas fotos incluye el pack?",
    answer: [
      "El pack incluye todas las fotos que el sistema reconozca de tu rostro o número de dorsal. En general, se detectan entre 5 y 15 fotos, aunque podrían ser más.",
      "Si se detectan más imágenes luego de tu compra, también estarán disponibles sin costo adicional.",
      "Asegúrate de que tu número sea visible y no esté cubierto por ropa u objetos para mejorar la detección.",
    ],
  },
  {
    question: "¿Por qué otros participantes tienen más fotos que yo?",
    answer:
      "El sistema detecta fotos por cara o número, pero si tu cara o dorsal estaban tapados (con gorros, gafas, ropa de abrigo, etc.), puede que se hayan captado menos fotos tuyas.",
  },
  {
    question: "Envié un email y aún no me han contestado",
    answer: [
      "Respondemos en un plazo de 24 a 72 horas. En algunos casos puede tardar más por la complejidad del caso.",
      "Recuerda incluir el evento en el que participaste, tu número de dorsal completo y escribir desde el mismo correo con el que te registraste.",
    ],
  },
  {
    question: "Volver a acceder con el código que llega por email",
    answer:
      "El código de acceso enviado por email no puede reutilizarse. Debes solicitar uno nuevo o generar una contraseña desde tu perfil al ingresar.",
  },
  {
    question: "Me aparecen fotos en las que no estoy yo",
    answer:
      "Si ves fotos en las que no apareces, comunicate con nosotros a info@jerpro.com.ar. La imagen se desvinculará de tu perfil.",
  },
  {
    question: "¿En qué resolución se encuentran las fotos?",
    answer: [
      "Las imágenes estarán disponibles en alta resolución (2048 píxeles por el lado más largo) y no contendrán ninguna marca de agua.",
      "Una vez hayas realizado el pago, podrás descargar las fotografías desde tu perfil.",
    ],
  },
  {
    question: "¿Puedo comprar las fotos de otro dorsal?",
    answer:
      "Solo es posible comprar las fotos de 1 dorsal por cuenta. Las fotos son personales. Si tu dorsal es incorrecto comunícate con info@jerpro.com.ar para cambiarlo. Al descargar las fotos de otro dorsal pierdes la posibilidad de cambiar a uno nuevo salvo que compres el pack nuevamente.",
  },
  {
    question: "No puedo iniciar sesión o no he recibido el código",
    answer: [
      "Si no puedes iniciar sesión o no has recibido el código de acceso por email, escríbenos a info@jerpro.com.ar con la siguiente información:",
      "• Correo electrónico que usaste para registrarte",
      "• Tu nombre completo",
      "• Tu número de dorsal",
      "• Evento en el que participaste",
      "Verificaremos tus datos y te ayudaremos a restablecer tu acceso.",
    ],
  },
  {
    question: "Problemas con el pago",
    answer:
      "En el caso de haber realizado una compra y experimentar dificultades con el reconocimiento del pago, es posible que esto se deba a que algunas pasarelas de pago implementen un proceso de confirmación manual. Si te encuentras en esta situación, te invitamos a que nos envíes una copia del correo electrónico que recibiste por parte de la pasarela de pago a nuestro correo de soporte (info@jerpro.com.ar). De esta manera, podremos asignar correctamente tu pago y brindarte la asistencia necesaria.",
  },
  {
    question: "¿Cuándo me mandan las fotos?",
    answer:
      "Las fotos se entregan en formato digital y no se envían impresas. Estarán disponibles para su descarga desde www.jerpro.com.ar apenas se procese el pago.",
  },
  {
    question: "¿Cómo solicito la eliminación de mis datos?",
    answer:
      "Si deseas que eliminemos tus datos de nuestra base de datos, te invitamos a que realices una solicitud formal a través del correo electrónico de soporte: info@jerpro.com.ar. Estaremos encantados de atender tu solicitud y proceder a la eliminación de tus datos de acuerdo con nuestras políticas de privacidad.",
  },
]

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="overflow-hidden border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
      >
        <h3 className="text-lg font-semibold text-foreground pr-4">{item.question}</h3>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-primary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-border bg-muted/20 p-6">
          {Array.isArray(item.answer) ? (
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              {item.answer.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
          )}
        </div>
      )}
    </Card>
  )
}

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl mb-4">
                Preguntas <span className="text-primary">Frecuentes</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Encontrá respuestas a las preguntas más comunes sobre nuestro servicio de fotografía deportiva
              </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {faqData.map((item, index) => (
                <FAQAccordion key={index} item={item} index={index} />
              ))}
            </div>

            {/* Contact Section */}
            <Card className="mt-12 border-primary/20 bg-primary/5 p-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">¿No encontraste lo que buscabas?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si tenés alguna otra consulta, no dudes en contactarnos. Estamos para ayudarte.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <a
                    href="mailto:info@jerpro.com.ar"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Contactanos por email
                  </a>
                  <span className="text-sm text-muted-foreground">info@jerpro.com.ar</span>
                </div>
              </div>
            </Card>

            {/* Legal Links */}
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Avisos legales</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Si requieres consultar nuestros avisos legales, te proporcionamos los enlaces a continuación:
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/privacidad"
                  className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                >
                  Política de Privacidad
                </a>
                <a
                  href="/terminos"
                  className="text-sm text-primary hover:text-primary/80 underline transition-colors"
                >
                  Términos y Condiciones
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Por favor, toma el tiempo necesario para revisar estos documentos detenidamente, ya que contienen
                información importante sobre cómo manejamos y protegemos tus datos personales, así como los términos y
                condiciones que rigen el uso de nuestros servicios.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
