"use client"

import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchForm } from "@/components/search-form"
import { PhotoGallery } from "@/components/photo-gallery"
import Image from "next/image"

function SearchPageContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="relative h-32 overflow-hidden border-b border-border">
          <Image src="/jerpro-banner.png" alt="JERPRO - Encontrá tu foto" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
        </div>

        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">Buscá tus fotos</h1>
              <p className="text-pretty text-lg text-muted-foreground leading-relaxed">
                Ingresá tu número de dorsal para encontrar todas tus fotos del evento
              </p>
            </div>

            <SearchForm />
            <PhotoGallery />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
