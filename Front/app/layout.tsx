import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JERPRO - Fotografía Deportiva Profesional",
  description:
    "Encontrá tus fotos de Running, Ciclismo, Enduro y más. Buscá por número de dorsal, seleccioná tus fotos favoritas y descargalas en alta resolución.",
  keywords: [
    "fotografía deportiva",
    "fotos running",
    "fotos ciclismo",
    "fotos enduro",
    "fotos mtb",
    "fotos trail",
    "fotos triatlón",
    "dorsal",
    "eventos deportivos",
    "JERPRO",
  ],
  authors: [{ name: "JERPRO" }],
  creator: "JERPRO",
  publisher: "JERPRO",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://jerpro.com.ar",
    siteName: "JERPRO",
    title: "JERPRO - Fotografía Deportiva Profesional",
    description:
      "Encontrá tus fotos de Running, Ciclismo, Enduro y más. Buscá por número de dorsal.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "JERPRO - Fotografía Deportiva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JERPRO - Fotografía Deportiva Profesional",
    description:
      "Encontrá tus fotos de Running, Ciclismo, Enduro y más. Buscá por número de dorsal.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
