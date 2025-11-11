import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HowItWorks } from "@/components/how-it-works"

export const metadata = {
  title: "Cómo funciona - JERPRO",
  description: "Conocé cómo funciona nuestro sistema de búsqueda y compra de fotos deportivas",
}

export default function ComoFuncionaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
